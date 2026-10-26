import { api, clearTokens, getRefreshToken, refreshSessionNow, setTokens, ApiError } from './http';

export type Rol = 'PACIENTE' | 'ODONTOLOGO';

/** Respuesta de /api/auth/login | register | refresh | google (ya en camelCase). */
export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  rol: Rol;
  nombreCompleto: string;
};

export type RegistroInput = {
  numeroDocumento: string;
  tipoDocumento: 'DNI' | 'CE';
  nombreCompleto: string;
  telefono: string;
  correo: string;
  password: string; // mínimo 8 caracteres
  rol: Rol;
  /** Obligatorio solo si rol = ODONTOLOGO. */
  numeroColegiatura?: string;
  /** El backend exige true (Ley 29733). Sin esto responde 400. */
  aceptaPrivacidad: boolean;
};

export async function login(correo: string, password: string, signal?: AbortSignal): Promise<AuthSession> {
  const s = await api<AuthSession>('/api/auth/login', { method: 'POST', body: { correo, password }, auth: false, signal });
  setTokens(s.accessToken, s.refreshToken);
  return s;
}

export async function register(input: RegistroInput): Promise<AuthSession> {
  const s = await api<AuthSession>('/api/auth/register', { method: 'POST', body: input, auth: false });
  setTokens(s.accessToken, s.refreshToken);
  return s;
}

/* ───────── Google ───────── */

/** Datos que el backend pide cuando la cuenta de Google es nueva (Google no da documento ni teléfono). */
export type GoogleExtra = {
  rol?: Rol;
  tipoDocumento?: 'DNI' | 'CE';
  numeroDocumento?: string;
  telefono?: string;
  numeroColegiatura?: string;
  aceptaPrivacidad?: boolean;
};

export type GoogleResultado =
  | { estado: 'sesion'; sesion: AuthSession }
  | { estado: 'completar'; correo: string; nombreCompleto: string };

/**
 * POST /api/auth/google. Dos posibles respuestas:
 *  - cuenta existente (o datos completos) → tokens → 'sesion'
 *  - cuenta nueva sin datos → perfilCompleto:false → 'completar' (hay que pedir documento, teléfono, rol…)
 * Lanza ApiError(409) si el correo ya existe con contraseña, y ApiError(404/503) si el backend aún no lo tiene.
 */
export async function loginConGoogle(idToken: string, extra: GoogleExtra = {}): Promise<GoogleResultado> {
  const r = await api<Partial<AuthSession> & { perfilCompleto?: boolean; correo?: string }>('/api/auth/google', {
    method: 'POST',
    body: { idToken, ...extra },
    auth: false,
  });
  if (r.perfilCompleto === false || !r.accessToken) {
    return { estado: 'completar', correo: r.correo ?? '', nombreCompleto: r.nombreCompleto ?? '' };
  }
  const sesion = r as AuthSession;
  setTokens(sesion.accessToken, sesion.refreshToken);
  return { estado: 'sesion', sesion };
}

/**
 * POST /api/auth/google/registro: crea la cuenta nueva de Google con los datos que Google no tiene
 * (documento, teléfono, rol, COP si es odontólogo y aceptaPrivacidad = true) y abre la sesión.
 */
export async function registroConGoogle(
  idToken: string,
  datos: Required<Pick<GoogleExtra, 'rol' | 'tipoDocumento' | 'numeroDocumento' | 'telefono'>> &
    Pick<GoogleExtra, 'numeroColegiatura'> & { nombreCompleto?: string; aceptaPrivacidad: true },
): Promise<AuthSession> {
  const sesion = await api<AuthSession>('/api/auth/google/registro', {
    method: 'POST',
    body: { idToken, ...datos },
    auth: false,
  });
  setTokens(sesion.accessToken, sesion.refreshToken);
  return sesion;
}

/** Al abrir la app: si hay refresh token guardado, lo canjea. true = la sesión sigue vigente. */
export async function restoreSession(): Promise<boolean> {
  if (!getRefreshToken()) return false;
  return refreshSessionNow();
}

/**
 * Cierra la sesión: borra los tokens de inmediato y avisa al servidor (POST /api/auth/logout) para que
 * revoque el refresh token de este dispositivo. Si el aviso falla no importa: el token vence solo.
 */
export function logout() {
  const refresh = getRefreshToken();
  clearTokens();
  if (refresh) {
    void api<void>('/api/auth/logout', { method: 'POST', body: { refreshToken: refresh }, auth: false }).catch(() => undefined);
  }
}

/* ───────── Olvidé mi contraseña ───────── */

/** Envía un código de 6 dígitos al correo (vale 15 min; uno cada 60 s). El servidor responde 202 exista o no la cuenta. */
export const recuperarPassword = (correo: string) =>
  api<void>('/api/auth/recuperar-password', { method: 'POST', body: { correo }, auth: false });

/** Cambia la contraseña con el código recibido (máx. 5 intentos por código) y cierra todas las sesiones abiertas. */
export const restablecerPassword = (correo: string, codigo: string, passwordNueva: string) =>
  api<void>('/api/auth/restablecer-password', { method: 'POST', body: { correo, codigo, passwordNueva }, auth: false });

export { ApiError };
