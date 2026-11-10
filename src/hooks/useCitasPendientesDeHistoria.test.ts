import { describe, expect, it, vi } from 'vitest';
import type { CitaApi } from '@/api/citas';
import { rangoAgendaValido } from '@/lib/format';
import { buscarCitasPendientesDeHistoria } from './useCitasPendientesDeHistoria';

const AHORA = new Date('2026-11-10T15:00:00-05:00');

function cita(id: string, inicio: string, estado: CitaApi['estado'] = 'COMPLETADA', pacienteId = 'p1'): CitaApi {
  return {
    id, estado, inicio, fin: inicio, zonaHoraria: 'America/Lima', precio: 100, depositoRequerido: 30,
    odontologo: { id: 'o1', nombre: 'Odontólogo' }, paciente: { id: pacienteId, nombre: 'Paciente' },
    servicio: { id: 's1', titulo: 'Servicio' }, creadoEn: inicio,
  };
}

/** Agenda falsa: devuelve las citas cuyo inicio cae en [desde, hasta). Registra cada rango pedido. */
function agendaFalsa(citas: CitaApi[]) {
  const pedidos: [string, string][] = [];
  const fn = vi.fn(async (desde: string, hasta: string) => {
    pedidos.push([desde, hasta]);
    return citas.filter((c) => c.inicio.slice(0, 10) >= desde && c.inicio.slice(0, 10) < hasta);
  });
  return { fn, pedidos };
}

describe('buscarCitasPendientesDeHistoria', () => {
  const datos = [
    cita('hoy-temprano', '2026-11-10T09:00:00-05:00'), // hoy, ya pasó: debe aparecer (antes se excluía)
    cita('ayer', '2026-11-09T10:00:00-05:00'),
    cita('hace-90', '2026-08-12T10:00:00-05:00'), // segundo tramo
    cita('con-historia', '2026-11-01T10:00:00-05:00'),
    cita('futura', '2026-11-10T18:00:00-05:00'), // COMPLETADA pero aún no empieza: no
    cita('confirmada', '2026-11-05T10:00:00-05:00', 'CONFIRMADA'),
    cita('otro-paciente', '2026-11-05T11:00:00-05:00', 'COMPLETADA', 'p2'),
  ];

  it('encuentra pendientes en varios tramos, sin duplicados ni citas ajenas', async () => {
    const { fn, pedidos } = agendaFalsa(datos);
    const r = await buscarCitasPendientesDeHistoria('p1', { objetivo: 3, conHistoria: new Set(['con-historia']), ahora: AHORA, pedirAgenda: fn });
    expect(r.citas.map((c) => c.id)).toEqual(['hoy-temprano', 'ayer', 'hace-90']);
    expect(new Set(r.citas.map((c) => c.id)).size).toBe(r.citas.length);
    pedidos.forEach(([d, h]) => expect(rangoAgendaValido(d, h)).toBe(true));
    expect(pedidos).toHaveLength(2); // se detiene al encontrar las 3 esperadas
  });

  it('no consulta nada si no hay pendientes esperadas', async () => {
    const { fn } = agendaFalsa(datos);
    const r = await buscarCitasPendientesDeHistoria('p1', { objetivo: 0, conHistoria: new Set(), ahora: AHORA, pedirAgenda: fn });
    expect(fn).not.toHaveBeenCalled();
    expect(r.citas).toEqual([]);
  });

  it('con objetivo desconocido revisa solo el tramo reciente', async () => {
    const { fn } = agendaFalsa(datos);
    await buscarCitasPendientesDeHistoria('p1', { objetivo: null, conHistoria: new Set(), ahora: AHORA, pedirAgenda: fn });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respeta el máximo de tramos aunque falten pendientes', async () => {
    const { fn } = agendaFalsa([]);
    const r = await buscarCitasPendientesDeHistoria('p1', { objetivo: 5, conHistoria: new Set(), ahora: AHORA, pedirAgenda: fn, maxTramos: 4 });
    expect(fn).toHaveBeenCalledTimes(4);
    expect(r.citas).toEqual([]);
  });

  it('propaga el error del backend', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('caído'));
    await expect(buscarCitasPendientesDeHistoria('p1', { objetivo: 1, conHistoria: new Set(), ahora: AHORA, pedirAgenda: fn })).rejects.toThrow('caído');
  });
});
