/**
 * Cliente HTTP único hacia el backend Spring Boot.
 *
 * Reglas del backend que este archivo respeta:
 *  - Jackson usa SNAKE_CASE en entrada y salida → convertimos claves en ambos sentidos.
 *  - CORS solo permite los headers Authorization y Content-Type → no agregues otros.
 *  - Access token dura 15 min; refresh token dura 30 días y se ROTA en cada /api/auth/refresh.
 *  - Errores llegan como { timestamp, status, error, mensaje, path }.
 */

export const API_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

const REFRESH_KEY = 'odonto_refresh_token';
export const SESSION_EXPIRED_EVENT = 'odonto:session-expired';

/* ───────── tokens ───────── */
// El access token vive solo en memoria (se pierde al recargar y se recupera con el refresh).
// El refresh token va en localStorage: es cómodo, pero un XSS podría leerlo; mantén la CSP estricta
// y no renderices HTML de terceros sin sanitizar.
let accessToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  try {
    localStorage.setItem(REFRESH_KEY, refresh);
  } catch {
    /* modo privado: la sesión durará hasta recargar */
  }
}
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}
export function clearTokens() {
  accessToken = null;
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* noop */
  }
}

/* ───────── snake_case <-> camelCase ───────── */
const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function mapKeys(value: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => mapKeys(v, fn));
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof FormData)) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [fn(k), mapKeys(v, fn)]));
  }
  return value;
}
export const camelize = <T>(v: unknown) => mapKeys(v, toCamel) as T;
export const snakeize = (v: unknown) => mapKeys(v, toSnake);

/* ───────── errores ───────── */
export class ApiError extends Error {
  status: number;
  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

/* ───────── network error handling ───────── */
let consecutiveNetworkErrors = 0;
let networkDown = false;
let networkDownSince = 0;
const MAX_NETWORK_ERRORS = 3;
/** Pasado este tiempo en modo offline se permite un intento real para comprobar si volvió la conexión. */
const NETWORK_RETRY_AFTER_MS = 5000;

function markNetworkSuccess() {
  consecutiveNetworkErrors = 0;
  networkDown = false;
}

/** true solo mientras estamos en modo offline y aún no toca reintentar. */
function isNetworkBlocked(): boolean {
  return networkDown && Date.now() - networkDownSince < NETWORK_RETRY_AFTER_MS;
}

if (typeof window !== 'undefined') {
  // Al recuperar internet el dispositivo, salimos del modo offline de inmediato.
  window.addEventListener('online', markNetworkSuccess);
}

function markNetworkError() {
  consecutiveNetworkErrors += 1;
  if (consecutiveNetworkErrors >= MAX_NETWORK_ERRORS) {
    const wasDown = networkDown;
    networkDown = true;
    networkDownSince = Date.now();
    if (!wasDown) window.dispatchEvent(new CustomEvent('odonto:network-down'));
  }
}

/* ───────── refresh con "single flight" ───────── */
let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing; // varias peticiones con 401 comparten UN solo refresh (el token se rota)
  const refresh = getRefreshToken();
  if (!refresh) return false;

  refreshing = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      const data = camelize<{ accessToken: string; refreshToken: string }>(await res.json());
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Restaura la sesión al abrir la app usando el refresh token guardado. */
export async function refreshSessionNow(): Promise<boolean> {
  return tryRefresh();
}

/* ───────── request ───────── */
type Query = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
  query?: Query;
  /** false para endpoints públicos (/api/auth/**, /api/public/**). */
  auth?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(toSnake(k), String(v));
    }
  }
  return url.toString();
}

export async function api<T = void>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, form, query, auth = true, signal } = opts;

  const doFetch = () => {
    const headers: Record<string, string> = {};
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    // Con FormData NO se pone Content-Type: el navegador agrega el boundary.
    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(snakeize(body)) : undefined),
      signal,
    });
  };

  if (isNetworkBlocked()) {
    throw new ApiError(0, 'Sin conexión con el servidor (modo offline).');
  }

  let res: Response;
  try {
    res = await doFetch();
    if (res.status === 401 && auth && (await tryRefresh())) res = await doFetch();
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    markNetworkError();
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.');
  }

  markNetworkSuccess();

  if (res.status === 401 && auth) {
    clearTokens();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!res.ok) {
    let mensaje = 'Ocurrió un error inesperado';
    try {
      const err = (await res.json()) as { mensaje?: string };
      if (err.mensaje) mensaje = err.mensaje;
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, mensaje);
  }

  // 202/204/205 (p. ej. logout, recuperar-password) llegan sin cuerpo
  if (res.status === 204 || res.status === 205) return undefined as T;
  const texto = await res.text();
  if (!texto) return undefined as T;
  return camelize<T>(JSON.parse(texto));
}

/**
 * Descarga un archivo binario protegido (p. ej. la constancia PDF de una cita) con el token de sesión.
 * Un <a href> normal no sirve: el access token vive en memoria y no viaja solo.
 */
export async function apiBlob(path: string, query?: Query): Promise<Blob> {
  if (isNetworkBlocked()) {
    throw new ApiError(0, 'Sin conexión con el servidor (modo offline).');
  }

  const doFetch = () =>
    fetch(buildUrl(path, query), { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} });

  let res: Response;
  try {
    res = await doFetch();
    if (res.status === 401 && (await tryRefresh())) res = await doFetch();
  } catch {
    markNetworkError();
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.');
  }

  markNetworkSuccess();

  if (!res.ok) {
    let mensaje = 'No se pudo descargar el archivo';
    try {
      const err = (await res.json()) as { mensaje?: string };
      if (err.mensaje) mensaje = err.mensaje;
    } catch {
      /* sin JSON */
    }
    throw new ApiError(res.status, mensaje);
  }
  return res.blob();
}
