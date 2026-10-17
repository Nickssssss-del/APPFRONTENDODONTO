import type { CitaApi } from '@/api/citas';

/** Estados en los que el paciente realmente tiene (o tuvo) una cita con el odontólogo. */
const ESTADOS_CON_RELACION = new Set(['PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'COMPLETADA', 'INASISTENCIA_PENALIZADA', 'REPROGRAMADA']);

export type PacienteResumen = {
  id: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  /** citas COMPLETADA */
  visitas: number;
  /** inicio de la última cita ya pasada (cualquier estado de la lista) */
  ultimaCita: string | null;
  /** la próxima cita futura confirmada o por confirmar */
  proxima: CitaApi | null;
  citas: CitaApi[];
};

export const iniciales = (nombre: string) =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'PA';

/**
 * El backend no tiene un endpoint de "pacientes": se arman a partir de las citas de la agenda del odontólogo.
 * Solo aparecen pacientes con al menos una cita pagada.
 */
export function agruparPacientes(citas: CitaApi[]): PacienteResumen[] {
  const ahora = Date.now();
  const mapa = new Map<string, PacienteResumen>();
  for (const c of citas) {
    if (!c.paciente || !ESTADOS_CON_RELACION.has(c.estado)) continue;
    let p = mapa.get(c.paciente.id);
    if (!p) {
      p = { id: c.paciente.id, nombre: c.paciente.nombre, telefono: c.paciente.telefono, correo: c.paciente.correo, visitas: 0, ultimaCita: null, proxima: null, citas: [] };
      mapa.set(p.id, p);
    }
    p.citas.push(c);
    if (c.estado === 'COMPLETADA') p.visitas += 1;
    const inicio = new Date(c.inicio).getTime();
    if (inicio <= ahora) {
      if (!p.ultimaCita || inicio > new Date(p.ultimaCita).getTime()) p.ultimaCita = c.inicio;
    } else if (c.estado === 'CONFIRMADA' || c.estado === 'PENDIENTE_CONFIRMACION') {
      if (!p.proxima || inicio < new Date(p.proxima.inicio).getTime()) p.proxima = c;
    }
  }
  for (const p of mapa.values()) p.citas.sort((a, b) => b.inicio.localeCompare(a.inicio));
  return [...mapa.values()].sort((a, b) => (b.ultimaCita ?? '').localeCompare(a.ultimaCita ?? '') || a.nombre.localeCompare(b.nombre));
}
