import { api, clearTokens, getRefreshToken, refreshSessionNow, setTokens } from './http';

export type Rol = 'PACIENTE' | 'ODONTOLOGO';

/** Respuesta de /api/auth/login | register | refresh (ya en camelCase). */
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
};

export async function login(correo: string, password: string): Promise<AuthSession> {
  const s = await api<AuthSession>('/api/auth/login', { method: 'POST', body: { correo, password }, auth: false });
  setTokens(s.accessToken, s.refreshToken);
  return s;
}

export async function register(input: RegistroInput): Promise<AuthSession> {
  const s = await api<AuthSession>('/api/auth/register', { method: 'POST', body: input, auth: false });
  setTokens(s.accessToken, s.refreshToken);
  return s;
}

/**
 * Al abrir la app: si hay refresh token guardado, lo canjea. Devuelve el rol si la sesión sigue vigente.
 * (/api/auth/refresh devuelve rol y nombre, pero http.ts solo guarda los tokens; pide el perfil aparte
 * cuando exista un GET /api/usuarios/yo.)
 */
export async function restoreSession(): Promise<boolean> {
  if (!getRefreshToken()) return false;
  return refreshSessionNow();
}

export function logout() {
  clearTokens();
}
