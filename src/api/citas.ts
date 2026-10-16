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
};

export type PagoApi = {
  pagoId: string;
  estado: string;
  metodo: MetodoPago;
  monto: number;
  numeroOperacion?: string | null;
  verificadoEn?: string | null;
  simulado: boolean;
  cita: CitaApi;
};

/** `inicio` = el inicio EXACTO de un turno devuelto por la disponibilidad (con zona horaria). 409 si ya no está libre. */
export const reservarCita = (odontologoId: string, servicioId: string, inicio: string) =>
  api<CitaApi>('/api/citas', { method: 'POST', body: { odontologoId, servicioId, inicio } });

export const pagarDeposito = (citaId: string, metodo: MetodoPago) =>
  api<PagoApi>(`/api/citas/${citaId}/pagar`, { method: 'POST', body: { metodo } });

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
