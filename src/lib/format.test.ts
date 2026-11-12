import { describe, expect, it } from 'vitest';
import {
  MAX_DIAS_RANGO_AGENDA, diasAgendaOdontologo, diasEntre, fechaIsoLima, rangoAgendaOdontologo, rangoAgendaValido,
  sumarDias, tramosAgendaHaciaAtras,
} from './format';

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
