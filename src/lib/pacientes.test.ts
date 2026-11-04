import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { iniciales, agruparPacientes } from './pacientes';
import type { CitaApi } from '@/api/citas';

const AHORA = new Date('2026-10-20T12:00:00Z').getTime();
const DIA = 86_400_000;
const iso = (off: number) => new Date(AHORA + off).toISOString();

const cita = (id: string, pacienteId: string, nombre: string, estado: string, off: number): CitaApi =>
  ({ id, estado, inicio: iso(off), fin: iso(off + 3_600_000), paciente: { id: pacienteId, nombre } }) as unknown as CitaApi;

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(AHORA); });
afterEach(() => vi.useRealTimers());

describe('iniciales', () => {
  it('toma las dos primeras iniciales en mayúscula', () => {
    expect(iniciales('juan perez lopez')).toBe('JP');
  });
  it('una sola palabra', () => {
    expect(iniciales('Ana')).toBe('A');
  });
  it('vacío devuelve PA', () => {
    expect(iniciales('')).toBe('PA');
    expect(iniciales('   ')).toBe('PA');
  });
});

describe('agruparPacientes', () => {
  it('agrupa citas del mismo paciente y cuenta solo las COMPLETADA como visitas', () => {
    const r = agruparPacientes([
      cita('1', 'p1', 'Ana Ruiz', 'COMPLETADA', -10 * DIA),
      cita('2', 'p1', 'Ana Ruiz', 'COMPLETADA', -3 * DIA),
      cita('3', 'p1', 'Ana Ruiz', 'CONFIRMADA', 2 * DIA),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].visitas).toBe(2);
    expect(r[0].citas).toHaveLength(3);
  });
  it('ignora citas sin pago o canceladas', () => {
    const r = agruparPacientes([
      cita('1', 'p1', 'Ana Ruiz', 'PENDIENTE_PAGO', DIA),
      cita('2', 'p2', 'Luis Gil', 'CANCELADA_SIN_REEMBOLSO', -DIA),
    ]);
    expect(r).toHaveLength(0);
  });
  it('ultimaCita es la más reciente ya pasada; proxima es la futura más cercana', () => {
    const [p] = agruparPacientes([
      cita('1', 'p1', 'Ana Ruiz', 'COMPLETADA', -10 * DIA),
      cita('2', 'p1', 'Ana Ruiz', 'COMPLETADA', -3 * DIA),
      cita('3', 'p1', 'Ana Ruiz', 'CONFIRMADA', 5 * DIA),
      cita('4', 'p1', 'Ana Ruiz', 'CONFIRMADA', 2 * DIA),
    ]);
    expect(p.ultimaCita).toBe(iso(-3 * DIA));
    expect(p.proxima?.id).toBe('4');
  });
  it('ordena pacientes por última cita (más reciente primero)', () => {
    const r = agruparPacientes([
      cita('1', 'p1', 'Ana Ruiz', 'COMPLETADA', -10 * DIA),
      cita('2', 'p2', 'Beto Soto', 'COMPLETADA', -1 * DIA),
    ]);
    expect(r.map((p) => p.id)).toEqual(['p2', 'p1']);
  });
  it('lista vacía devuelve lista vacía', () => {
    expect(agruparPacientes([])).toEqual([]);
  });
});
