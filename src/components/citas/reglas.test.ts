import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { puedeReprogramar, puedeResponderAsistencia, puedeVerReembolsos, HORA } from './reglas';
import type { CitaApi } from '@/api/citas';

const AHORA = new Date('2026-10-20T12:00:00Z').getTime();
const iso = (offsetMs: number) => new Date(AHORA + offsetMs).toISOString();

// Solo se rellenan los campos que usan las reglas.
const cita = (p: Partial<CitaApi>): CitaApi =>
  ({ estado: 'CONFIRMADA', inicio: iso(48 * HORA), fin: iso(49 * HORA), citaOrigenId: null, ...p }) as unknown as CitaApi;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AHORA);
});
afterEach(() => vi.useRealTimers());

describe('puedeReprogramar', () => {
  it('permite si faltan 24 h o más y está confirmada', () => {
    expect(puedeReprogramar(cita({ inicio: iso(24 * HORA) }))).toBe(true);
  });
  it('permite si está pendiente de confirmación', () => {
    expect(puedeReprogramar(cita({ estado: 'PENDIENTE_CONFIRMACION' }))).toBe(true);
  });
  it('rechaza si faltan menos de 24 h', () => {
    expect(puedeReprogramar(cita({ inicio: iso(24 * HORA - 1) }))).toBe(false);
  });
  it('rechaza si ya fue reprogramada una vez (tiene citaOrigenId)', () => {
    expect(puedeReprogramar(cita({ citaOrigenId: 'abc' } as Partial<CitaApi>))).toBe(false);
  });
  it('rechaza estados que no permiten reprogramar', () => {
    expect(puedeReprogramar(cita({ estado: 'COMPLETADA' }))).toBe(false);
    expect(puedeReprogramar(cita({ estado: 'PENDIENTE_PAGO' }))).toBe(false);
  });
});

describe('puedeResponderAsistencia', () => {
  it('rechaza antes de 15 min del inicio', () => {
    expect(puedeResponderAsistencia(cita({ inicio: iso(-14 * 60_000), fin: iso(HORA) }))).toBe(false);
  });
  it('permite desde 15 min después del inicio', () => {
    expect(puedeResponderAsistencia(cita({ inicio: iso(-15 * 60_000), fin: iso(HORA) }))).toBe(true);
  });
  it('permite hasta 72 h después del fin', () => {
    expect(puedeResponderAsistencia(cita({ inicio: iso(-80 * HORA), fin: iso(-72 * HORA) }))).toBe(true);
  });
  it('rechaza pasadas las 72 h del fin', () => {
    expect(puedeResponderAsistencia(cita({ inicio: iso(-80 * HORA), fin: iso(-72 * HORA - 1) }))).toBe(false);
  });
  it('rechaza si no está CONFIRMADA', () => {
    expect(puedeResponderAsistencia(cita({ estado: 'COMPLETADA', inicio: iso(-HORA), fin: iso(0) }))).toBe(false);
  });
});

describe('puedeVerReembolsos', () => {
  it('true en canceladas y completadas', () => {
    for (const estado of ['CANCELADA_CON_REEMBOLSO', 'CANCELADA_SIN_REEMBOLSO', 'COMPLETADA'] as const) {
      expect(puedeVerReembolsos(cita({ estado }))).toBe(true);
    }
  });
  it('false en confirmada o pendiente de pago', () => {
    expect(puedeVerReembolsos(cita({ estado: 'CONFIRMADA' }))).toBe(false);
    expect(puedeVerReembolsos(cita({ estado: 'PENDIENTE_PAGO' }))).toBe(false);
  });
});
