import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  horaLima, diaLima, fechaIsoLima, sumarDias, soles, segundosHasta, proximosDias,
  MAX_DIAS_RANGO_AGENDA, diasAgendaOdontologo, diasEntre, rangoAgendaOdontologo, rangoAgendaValido,
  tramosAgendaHaciaAtras,
} from './format';

describe('fechas en hora de Lima (UTC-5)', () => {
  it('horaLima convierte UTC a Lima', () => {
    expect(horaLima('2026-10-20T14:30:00Z')).toBe('09:30');
  });
  it('horaLima maneja medianoche', () => {
    expect(horaLima('2026-10-20T05:00:00Z')).toBe('00:00');
  });
  it('diaLima da día de semana, número y mes', () => {
    expect(diaLima('2026-10-20T14:30:00Z')).toBe('Mar 20 oct');
  });
  it('fechaIsoLima usa la fecha de Lima, no la UTC', () => {
    // 03:00 UTC del día 21 = 22:00 del día 20 en Lima
    expect(fechaIsoLima('2026-10-21T03:00:00Z')).toBe('2026-10-20');
  });
});

describe('sumarDias', () => {
  it('suma dentro del mes', () => {
    expect(sumarDias('2026-10-20', 5)).toBe('2026-10-25');
  });
  it('cruza fin de mes y de año', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('acepta días negativos', () => {
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('soles', () => {
  it('formatea con dos decimales', () => {
    expect(soles(50)).toBe('S/ 50.00');
    expect(soles(12.5)).toBe('S/ 12.50');
  });
  it('trata null y undefined como cero', () => {
    expect(soles(null)).toBe('S/ 0.00');
    expect(soles(undefined)).toBe('S/ 0.00');
  });
});

describe('segundosHasta y proximosDias', () => {
  afterEach(() => vi.useRealTimers());

  it('calcula segundos restantes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T10:00:00Z'));
    expect(segundosHasta('2026-10-20T10:05:00Z')).toBe(300);
  });
  it('devuelve 0 si ya pasó o no hay fecha', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T10:00:00Z'));
    expect(segundosHasta('2026-10-20T09:00:00Z')).toBe(0);
    expect(segundosHasta(null)).toBe(0);
    expect(segundosHasta(undefined)).toBe(0);
  });
  it('proximosDias genera la cantidad pedida, empezando hoy (Lima)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T15:00:00Z'));
    const dias = proximosDias(3);
    expect(dias).toHaveLength(3);
    expect(dias[0].fecha).toBe('2026-10-20');
    expect(dias[2].fecha).toBe('2026-10-22');
  });
});

// Fechas límite: fin de mes, fin de año, febrero bisiesto y no bisiesto, y una hora en que UTC ya cambió de día.
const FECHAS = [
  '2026-11-10T15:00:00Z', '2026-12-31T23:30:00-05:00', '2027-01-01T03:00:00Z',
  '2028-02-28T12:00:00Z', '2028-02-29T12:00:00Z', '2027-02-28T12:00:00Z', '2026-03-31T04:59:00Z',
].map((s) => new Date(s));

describe('rango de la agenda del odontólogo (R2)', () => {
  it.each(FECHAS)('nunca supera 62 días: %s', (ahora) => {
    const r = rangoAgendaOdontologo(ahora);
    expect(rangoAgendaValido(r.desde, r.hastaExclusivo)).toBe(true);
    expect(diasEntre(r.desde, r.hastaExclusivo)).toBe(MAX_DIAS_RANGO_AGENDA);
  });

  it.each(FECHAS)('incluye ayer y hoy: %s', (ahora) => {
    const r = rangoAgendaOdontologo(ahora);
    const hoy = fechaIsoLima(ahora);
    expect(r.hoy).toBe(hoy);
    expect(r.desde).toBe(sumarDias(hoy, -1));
    expect(r.hastaExclusivo > hoy).toBe(true);
  });

  it('los días visibles coinciden con lo que se pide al backend', () => {
    const ahora = FECHAS[0];
    const r = rangoAgendaOdontologo(ahora);
    const dias = diasAgendaOdontologo(ahora);
    expect(dias).toHaveLength(MAX_DIAS_RANGO_AGENDA);
    expect(dias[0].fecha).toBe(r.desde);
    expect(sumarDias(dias[dias.length - 1].fecha, 1)).toBe(r.hastaExclusivo);
    expect(dias.some((d) => d.fecha === r.hoy)).toBe(true);
  });

  it('rechaza los rangos que el backend rechaza', () => {
    expect(rangoAgendaValido('2026-11-09', '2027-01-12')).toBe(false); // el rango que causaba el 400 (64 días)
    expect(rangoAgendaValido('2026-11-10', '2026-11-10')).toBe(false); // vacío
    expect(rangoAgendaValido('2026-11-10', '2027-01-11')).toBe(true); // exactamente 62
    expect(rangoAgendaValido('2026-11-10', '2027-01-12')).toBe(false); // 63
  });
});

describe('tramos hacia atrás (R3 / M1)', () => {
  it.each(FECHAS)('cada tramo es válido, contiguo y sin solaparse: %s', (ahora) => {
    const tramos = tramosAgendaHaciaAtras(6, ahora);
    expect(tramos).toHaveLength(6);
    expect(tramos[0].hastaExclusivo).toBe(sumarDias(fechaIsoLima(ahora), 1)); // incluye hoy
    tramos.forEach((t, i) => {
      expect(rangoAgendaValido(t.desde, t.hastaExclusivo)).toBe(true);
      if (i > 0) expect(t.hastaExclusivo).toBe(tramos[i - 1].desde);
    });
  });
});
