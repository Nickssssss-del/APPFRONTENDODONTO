import { api } from './http';

export type TipoRespuestaChatbot = 'texto_simple' | 'lista_odontologos' | 'lista_horarios' | 'confirmacion';

export type OdontologoResumen = {
  id: string;
  nombre: string;
  consultorio?: string;
  distrito?: string;
  calificacion?: number;
  totalResenas?: number;
};

export type RespuestaChatbot = {
  sesionId: string;
  tipo: TipoRespuestaChatbot;
  mensaje: string;
  intencion?: string;
  /** Su forma depende de `tipo`: lista_odontologos → OdontologoResumen[]. */
  datos?: unknown;
  /** Botones sugeridos. */
  acciones?: string[];
};

export type MensajeHistorial = { emisor: string; texto: string; intencion?: string; creadoEn: string };

export const enviarMensaje = (mensaje: string, sesionId?: string) =>
  api<RespuestaChatbot>('/api/chatbot/mensaje', { method: 'POST', body: { mensaje, sesionId, canal: 'MOVIL' } });

export const historialChat = (sesionId: string) => api<MensajeHistorial[]>(`/api/chatbot/sesiones/${sesionId}/mensajes`);
