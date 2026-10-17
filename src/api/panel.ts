import { api, apiBlob } from './http';
import type { PerfilPublico, ServicioApi, HorarioApi, ItemCatalogo } from './catalog';

/**
 * Endpoints del backend que antes la app simulaba con datos de demostración.
 * Espejo de OdontologoDtos, HistoriaDtos, LiquidacionService, ReputacionService, ApelacionDtos y ResenaDtos.
 * Las claves llegan en snake_case y http.ts las convierte a camelCase.
 */

/* ───────── Mi consultorio (rol ODONTOLOGO) ───────── */
export type EstadoVerificacion = 'PENDIENTE' | 'OBSERVADO' | 'VERIFICADO' | 'RECHAZADO';
export type FrecuenciaDisponibilidad = string;

export type MiPerfil = {
  perfil: PerfilPublico;
  estadoVerificacion: EstadoVerificacion;
  notaObservacion?: string | null;
  ruc?: string | null;
  cci?: string | null;
  frecuenciaDisponibilidad?: FrecuenciaDisponibilidad | null;
  disponibilidadActualizadaEn?: string | null;
};

export type ActualizarPerfil = {
  nombreConsultorio?: string;
  direccionConsultorio?: string;
  distritoConsultorio?: string;
  latitud?: number;
  longitud?: number;
  especialidadIds?: number[];
  requiereConfirmacionManual?: boolean;
  ruc?: string;
  cci?: string;
};

export const miPerfil = (signal?: AbortSignal) => api<MiPerfil>('/api/odontologos/yo/perfil', { signal });
export const actualizarMiPerfil = (datos: ActualizarPerfil) =>
  api<MiPerfil>('/api/odontologos/yo/perfil', { method: 'PATCH', body: datos });

export type DiaSemanaApi = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';
export const DIAS_SEMANA: { api: DiaSemanaApi; label: string }[] = [
  { api: 'LUNES', label: 'Lunes' },
  { api: 'MARTES', label: 'Martes' },
  { api: 'MIERCOLES', label: 'Miércoles' },
  { api: 'JUEVES', label: 'Jueves' },
  { api: 'VIERNES', label: 'Viernes' },
  { api: 'SABADO', label: 'Sábado' },
  { api: 'DOMINGO', label: 'Domingo' },
];

export type EstadoVerificacionResponse = { estado: EstadoVerificacion; nota?: string | null; intentosFallidos: number; ultimoIntento?: string | null };
export const estadoVerificacion = () => api<EstadoVerificacionResponse>('/api/odontologos/yo/verificacion');
/** Solo si sigue PENDIENTE; máximo una vez cada 10 minutos (429 si es antes). */
export const reintentarVerificacion = () => api<EstadoVerificacionResponse>('/api/odontologos/yo/verificacion/reintentar', { method: 'POST' });

export const misHorarios = () => api<HorarioApi[]>('/api/odontologos/yo/horarios');
/** Reemplaza TODO el horario semanal. Varios tramos por día están permitidos si no se cruzan. */
export const guardarHorarios = (horarios: HorarioApi[]) =>
  api<HorarioApi[]>('/api/odontologos/yo/horarios', { method: 'PUT', body: { horarios } });

export const misServicios = () => api<ServicioApi[]>('/api/odontologos/yo/servicios');
export type ServicioInput = { categoriaId: number; titulo: string; descripcion?: string; precioTotal: number; duracionMinutos: number };
export const crearServicio = (s: ServicioInput) => api<ServicioApi>('/api/odontologos/yo/servicios', { method: 'POST', body: s });
export const actualizarServicio = (id: string, s: ServicioInput) =>
  api<ServicioApi>(`/api/odontologos/yo/servicios/${id}`, { method: 'PUT', body: s });
export const desactivarServicio = (id: string) => api(`/api/odontologos/yo/servicios/${id}`, { method: 'DELETE' });

export type Bloqueo = { id: string; inicio: string; fin: string; motivo?: string | null; citasCanceladas: number };
export const misBloqueos = () => api<Bloqueo[]>('/api/odontologos/yo/bloqueos');
/** Fechas con zona horaria (ej. 2026-10-20T09:00:00-05:00), máximo 60 días. Cancela con reembolso las citas de ese rango. */
export const crearBloqueo = (inicio: string, fin: string, motivo?: string) =>
  api<Bloqueo>('/api/odontologos/yo/bloqueos', { method: 'POST', body: { inicio, fin, motivo } });
export const eliminarBloqueo = (id: string) => api(`/api/odontologos/yo/bloqueos/${id}`, { method: 'DELETE' });

export type AgendaHoy = { fecha: string; atiende: boolean | null; respondidoEn?: string | null; citasHoy: number; primeraCita?: string | null; citasCanceladas: number };
export const agendaHoy = (signal?: AbortSignal) => api<AgendaHoy>('/api/odontologos/yo/agenda-hoy', { signal });
export const confirmarAgendaHoy = (atiende: boolean, motivo?: string) =>
  api<AgendaHoy>('/api/odontologos/yo/agenda-hoy', { method: 'POST', body: { atiende, motivo } });

/* ───────── Ingresos (depósitos) ───────── */
export type Liquidacion = {
  id: string;
  citaId: string;
  paciente: string;
  servicio: string;
  fechaCita: string;
  estadoCita: string;
  monto: number;
  estado: string;
  retenidaPor?: string | null;
  pagarDesde?: string | null;
  referenciaPago?: string | null;
  liquidadoEn?: string | null;
};
export type MisIngresos = { enCustodia: number; pagado: number; devueltoAPacientes: number; liquidaciones: Liquidacion[] };
export const misIngresos = (signal?: AbortSignal) => api<MisIngresos>('/api/odontologos/yo/liquidaciones', { signal });

/* ───────── Historias clínicas ───────── */
export type Historia = {
  id: number;
  citaId: string;
  pacienteId: string;
  odontologo: string;
  servicio: string;
  fechaCita: string;
  diagnostico: string;
  tratamiento: string;
  notas?: string | null;
  creadoEn: string;
};
export type HistoriaInput = { diagnostico: string; tratamiento: string; notas?: string };

export const registrarHistoria = (citaId: string, datos: HistoriaInput) =>
  api<Historia>(`/api/citas/${citaId}/historia`, { method: 'POST', body: datos });
export const historiaDeCita = (citaId: string) => api<Historia>(`/api/citas/${citaId}/historia`);
/** Paciente: todas sus historias, la más reciente primero. */
export const misHistorias = (signal?: AbortSignal) => api<Historia[]>('/api/historias/mias', { signal });
/** Odontólogo: las historias que ÉL escribió para un paciente. */
export const historiasEscritasPara = (pacienteId: string, signal?: AbortSignal) =>
  api<Historia[]>('/api/odontologos/yo/historias', { query: { pacienteId }, signal });

/* ───────── Paciente: reputación, apelaciones, reseñas, constancias ───────── */
export type Reputacion = {
  strikes: number;
  limiteStrikes: number;
  estado: 'EXCELENTE' | 'REGULAR' | 'BLOQUEADO';
  restringidoHasta?: string | null;
  puedeReservar: boolean;
};
export const miReputacion = (signal?: AbortSignal) => api<Reputacion>('/api/usuarios/yo/reputacion', { signal });

export type Apelacion = {
  id: string;
  citaId: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  paciente: string;
  servicio: string;
  fechaCita: string;
  notaResolucion?: string | null;
  creadoEn: string;
  resueltoEn?: string | null;
};
/** Certificado: PDF, JPG o PNG de hasta 5 MB. Solo citas INASISTENCIA_PENALIZADA de los últimos 7 días. */
export const apelarInasistencia = (citaId: string, certificado: File) => {
  const form = new FormData();
  form.append('certificado', certificado);
  return api<Apelacion>(`/api/citas/${citaId}/apelacion`, { method: 'POST', form });
};
export const miApelacion = (citaId: string) => api<Apelacion>(`/api/citas/${citaId}/apelacion`);

export type CitaPorResenar = { citaId: string; odontologoId: string; odontologo: string; servicio: string; atendidaEl: string };
export const citasPorResenar = (signal?: AbortSignal) => api<CitaPorResenar[]>('/api/citas/por-resenar', { signal });
export const crearResena = (citaId: string, calificacion: number, comentario?: string) =>
  api<{ id: number }>(`/api/citas/${citaId}/resena`, { method: 'POST', body: { calificacion, comentario } });

export type ResenaPublica = { id: number; paciente: string; calificacion: number; comentario?: string | null; creadoEn: string };
export type ResenasOdontologo = {
  odontologoId: string;
  calificacion: number | null;
  totalResenas: number;
  distribucion: Record<string, number>;
  resenas: ResenaPublica[];
  pagina: number;
  tamano: number;
  totalPaginas: number;
};
export const resenasDeOdontologo = (id: string, pagina = 0, signal?: AbortSignal) =>
  api<ResenasOdontologo>(`/api/odontologos/${id}/resenas`, { auth: false, query: { pagina, tamano: 10 }, signal });

/** Constancia del depósito pagado (PDF). Devuelve el Blob para descargarlo con el token de sesión. */
export const descargarConstancia = (citaId: string) => apiBlob(`/api/citas/${citaId}/constancia`);

export function guardarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type { ItemCatalogo };
