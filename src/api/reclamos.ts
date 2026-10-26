import { api } from './http';

/** Libro de reclamaciones (Ley 29571): consultas, incidencias y reclamos sobre una cita o sobre la plataforma. */
export type TipoReclamo = 'CONSULTA' | 'INCIDENCIA' | 'RECLAMO';
export type EstadoReclamo = 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';

export type Reclamo = {
  id: string;
  /** Código de seguimiento que se muestra al usuario (REC-XXXXXXXX). */
  codigo: string;
  tipo: TipoReclamo;
  estado: EstadoReclamo;
  asunto: string;
  descripcion: string;
  reclamante?: string | null;
  citaId?: string | null;
  odontologo?: string | null;
  servicio?: string | null;
  fechaCita?: string | null;
  /** ODONTOLOGO (reclamo sobre una cita) o SOPORTE (equipo de OdontoSystem). */
  atiende: string;
  respuesta?: string | null;
  creadoEn: string;
  actualizadoEn?: string | null;
  resueltoEn?: string | null;
  /** Fecha límite de respuesta: 15 días hábiles desde el registro. */
  responderAntes?: string | null;
};

export type NuevoReclamo = { tipo: TipoReclamo; asunto: string; descripcion: string; citaId?: string };

/* Paciente / cualquier usuario */
export const crearReclamo = (datos: NuevoReclamo) => api<Reclamo>('/api/reclamos', { method: 'POST', body: datos });
export const misReclamos = () => api<Reclamo[]>('/api/reclamos/mios');
export const detalleReclamo = (id: string) => api<Reclamo>(`/api/reclamos/${id}`);
export const cerrarReclamo = (id: string) => api<Reclamo>(`/api/reclamos/${id}/cerrar`, { method: 'PATCH' });

/* Odontólogo */
export const reclamosRecibidos = () => api<Reclamo[]>('/api/odontologos/yo/reclamos');
/** resuelto=true lo pasa a RESUELTO (si no, EN_PROCESO); devolverDeposito=true devuelve el depósito de esa cita. */
export const responderReclamo = (id: string, respuesta: string, resuelto: boolean, devolverDeposito?: boolean) =>
  api<Reclamo>(`/api/odontologos/yo/reclamos/${id}`, { method: 'PATCH', body: { respuesta, resuelto, devolverDeposito } });

export const ETIQUETA_TIPO_RECLAMO: Record<TipoReclamo, string> = {
  CONSULTA: 'Consulta',
  INCIDENCIA: 'Incidencia',
  RECLAMO: 'Reclamo',
};
export const ETIQUETA_ESTADO_RECLAMO: Record<EstadoReclamo, string> = {
  ABIERTO: 'Abierto',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
};
