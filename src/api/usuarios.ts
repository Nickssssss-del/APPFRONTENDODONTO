import { api } from './http';

/** GET /api/usuarios/yo — datos del usuario con sesión iniciada (incluye foto_perfil_url). */
export type UsuarioYo = {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  rol: 'PACIENTE' | 'ODONTOLOGO';
  fotoPerfilUrl?: string | null;
  correoVerificado?: boolean;
};

export const obtenerYo = () => api<UsuarioYo>('/api/usuarios/yo');
export const actualizarYo = (datos: { nombreCompleto?: string; telefono?: string }) =>
  api<UsuarioYo>('/api/usuarios/yo', { method: 'PATCH', body: datos });

/* ───────── Verificación de correo (OTP) ───────── */

/** Envía un código de 6 dígitos al correo (vale 15 min). 409 si ya está verificado; 429 si pidió otro hace < 1 min. */
export const pedirCodigoCorreo = () => api<void>('/api/usuarios/yo/verificar-correo/codigo', { method: 'POST' });
/** Confirma el código y devuelve los datos con correoVerificado = true. 400 si es incorrecto o venció. */
export const verificarCorreo = (codigo: string) =>
  api<UsuarioYo>('/api/usuarios/yo/verificar-correo', { method: 'POST', body: { codigo } });

/* ───────── Eliminar cuenta (Google Play / Ley 29733) ───────── */

/** confirmacion debe ser exactamente "ELIMINAR"; password es obligatoria si la cuenta tiene contraseña. 204. */
export const eliminarCuenta = (confirmacion: string, password?: string) =>
  api<void>('/api/usuarios/yo/eliminar-cuenta', {
    method: 'POST',
    body: { confirmacion, password: password || undefined },
  });

/* ───────── Privacidad (RNF07) ───────── */

export type Consentimiento = { versionPolitica: string; aceptadoEn: string };
/** Qué versión de la política aceptó el usuario y cuándo. */
export const misConsentimientos = () => api<Consentimiento[]>('/api/usuarios/yo/consentimientos');
/** Versión vigente de la política de privacidad (sin login). */
export const politicaVigente = () => api<{ version: string }>('/api/public/privacidad', { auth: false });

/* ───────── Notificaciones push (Firebase) ───────── */

export type SistemaOperativo = 'ANDROID' | 'IOS' | 'WEB';
/** Registra el token de Firebase Messaging de este celular. 204. */
export const registrarDispositivo = (token: string, sistemaOperativo: SistemaOperativo) =>
  api<void>('/api/usuarios/yo/dispositivos', { method: 'POST', body: { token, sistemaOperativo } });
/** Deja de enviar push a este celular (llamarlo antes de cerrar sesión). 204. */
export const quitarDispositivo = (token: string) =>
  api<void>('/api/usuarios/yo/dispositivos/quitar', { method: 'POST', body: { token } });
