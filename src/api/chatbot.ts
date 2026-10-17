import { api } from './http';

export type TipoRespuestaChatbot =
  | 'texto_simple' | 'lista_odontologos' | 'lista_servicios' | 'lista_horarios'
  | 'confirmacion' | 'cita_reservada' | 'lista_citas';

/** Botón que el bot sugiere. Al pulsarlo se vuelve a enviar { mensaje: etiqueta, accion, valor }. */
export type OpcionChat = { etiqueta: string; accion: string; valor?: string | null };

export type RespuestaChatbot = {
  sesionId: string;
  tipo: TipoRespuestaChatbot;
  mensaje: string;
  intencion?: string;
  /** Su forma depende de `tipo` (ver docs/arbol-conversacion-chatbot.md). */
  datos?: unknown;
  acciones?: string[];
  opciones?: OpcionChat[];
};

export type MensajeHistorial = { emisor: string; texto: string; intencion?: string; creadoEn: string };

/** `accion` y `valor` solo se envían cuando el usuario pulsó un botón. */
export const enviarMensaje = (mensaje: string, sesionId?: string, accion?: string, valor?: string | null) =>
  api<RespuestaChatbot>('/api/chatbot/mensaje', {
    method: 'POST',
    body: { mensaje, sesionId, canal: 'MOVIL', accion, valor },
  });

export const historialChat = (sesionId: string) => api<MensajeHistorial[]>(`/api/chatbot/sesiones/${sesionId}/mensajes`);
