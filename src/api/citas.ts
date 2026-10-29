import { api } from './http';

export type EstadoCita =
  | 'PENDIENTE_PAGO' | 'PENDIENTE_CONFIRMACION' | 'CONFIRMADA' | 'COMPLETADA'
  | 'CANCELADA_CON_REEMBOLSO' | 'CANCELADA_SIN_REEMBOLSO' | 'INASISTENCIA_PENALIZADA' | 'REPROGRAMADA';

export type MetodoPago = 'YAPE' | 'PLIN' | 'TARJETA';

export type CitaApi = {
  id: string;
  estado: EstadoCita;
  inicio: string;
  fin: string;
  zonaHoraria: string;
  precio: number;
  depositoRequerido: number;
  /** Tienes hasta esta hora para pagar el depósito; si no, el turno se libera solo. */
  pagarAntesDe?: string | null;
  odontologo: { id: string; nombre: string; consultorio?: string; direccion?: string; distrito?: string };
  paciente?: { id: string; nombre: string; telefono?: string; correo?: string };
  servicio: { id: string; titulo: string };
  motivoCancelacion?: string | null;
  creadoEn: string;
  /** Si nació de una reprogramación: la cita original (que quedó REPROGRAMADA). Solo se reprograma una vez. */
  citaOrigenId?: string | null;
};

export type PagoApi = {
  pagoId: string;
  estado: 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO' | 'REEMBOLSADO';
  metodo: MetodoPago;
  monto: number;
  numeroOperacion?: string | null;
  verificadoEn?: string | null;
  simulado: boolean;
  mensaje?: string | null;
  cita: CitaApi;
};

/** `inicio` = el inicio EXACTO de un turno devuelto por la disponibilidad (con zona horaria). 409 si ya no está libre. */
export const reservarCita = (odontologoId: string, servicioId: string, inicio: string) =>
  api<CitaApi>('/api/citas', { method: 'POST', body: { odontologoId, servicioId, inicio } });

export type PasarelaData = {
  token: string;
  medioPagoId?: string;
};

export const pagarDeposito = (
  citaId: string,
  metodo: MetodoPago,
  pasarela?: PasarelaData
) => {
  const body: Record<string, unknown> = { metodo };
  if (pasarela?.token) body.token = pasarela.token;
  if (pasarela?.medioPagoId) body.medioPagoId = pasarela.medioPagoId;
  return api<PagoApi>(`/api/citas/${citaId}/pagar`, { method: 'POST', body });
};

export const misCitas = () => api<CitaApi[]>('/api/citas/mias');
export const detalleCita = (id: string) => api<CitaApi>(`/api/citas/${id}`);
export const cancelarCita = (id: string, motivo?: string) =>
  api<CitaApi>(`/api/citas/${id}/cancelar`, { method: 'PATCH', body: { motivo } });

/* Agenda del odontólogo */
export const agendaOdontologo = (desde?: string, hasta?: string) =>
  api<CitaApi[]>('/api/odontologos/yo/citas', { query: { desde, hasta } });
export const confirmarCita = (id: string) => api<CitaApi>(`/api/odontologos/yo/citas/${id}/confirmar`, { method: 'PATCH' });
export const completarCita = (id: string) => api<CitaApi>(`/api/odontologos/yo/citas/${id}/completar`, { method: 'PATCH' });
export const marcarInasistencia = (id: string) => api<CitaApi>(`/api/odontologos/yo/citas/${id}/inasistencia`, { method: 'PATCH' });

/** Mueve la cita a otro turno libre del mismo odontólogo y servicio (una sola vez, hasta 24 h antes). 409 si el turno ya no está libre. */
export const reprogramarCita = (citaId: string, inicio: string) =>
  api<CitaApi>(`/api/citas/${citaId}/reprogramar`, { method: 'POST', body: { inicio } });

/* ───────── ¿Te atendieron? (asistencia) ───────── */

export type EstadoReporteAusencia = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'EN_RECLAMO';
export type AsistenciaRespuesta = {
  citaId: string;
  estadoCita: EstadoCita;
  reporte?: EstadoReporteAusencia | null;
  mensaje: string;
};
/**
 * Desde 15 min después del inicio y hasta 72 h después del fin. atendido=false reporta que el odontólogo no llegó;
 * durante la cita (hasta 2 h después del fin) hay que enviar latitud/longitud (a menos de 200 m del consultorio).
 */
export const responderAsistencia = (citaId: string, atendido: boolean, ubicacion?: { latitud: number; longitud: number }) =>
  api<AsistenciaRespuesta>(`/api/citas/${citaId}/asistencia`, { method: 'POST', body: { atendido, ...ubicacion } });

/* ───────── Reembolsos ───────── */

export type EstadoReembolso = 'SOLICITADO' | 'PROCESANDO' | 'REEMBOLSADO' | 'RECHAZADO' | 'ERROR';
export type Reembolso = {
  id: string;
  estado: EstadoReembolso;
  monto: number;
  motivo?: string | null;
  idExterno?: string | null;
  solicitadoEn: string;
  procesadoEn?: string | null;
  simulado: boolean;
};
export const reembolsosDeCita = (citaId: string) => api<Reembolso[]>(`/api/citas/${citaId}/reembolsos`);

/* ───────── Configuración de pagos (pública) ───────── */

export type MetodoDisponible = { metodo: MetodoPago; disponible: boolean; nota?: string | null };
export type ConfiguracionPagos = {
  modo: 'simulado' | 'mercadopago';
  mercadopagoLlavePublica?: string | null;
  modoPrueba: boolean;
  moneda: string;
  metodos: MetodoDisponible[];
};
export const configuracionPagos = () => api<ConfiguracionPagos>('/api/public/pagos/config', { auth: false });
