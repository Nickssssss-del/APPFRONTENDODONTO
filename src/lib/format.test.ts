import { describe, it, expect, vi, afterEach } from 'vitest';
import { horaLima, diaLima, fechaIsoLima, sumarDias, soles, segundosHasta, proximosDias } from './format';

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
