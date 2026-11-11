import { useSyncExternalStore } from 'react';

/**
 * Modo sin conexión de solo lectura.
 * Guarda en el teléfono la última respuesta de unas pocas consultas (perfil sin DNI, citas, agenda),
 * separadas por usuario, para mostrarlas cuando no hay internet. Nunca guarda historias clínicas.
 * Todo se borra al cerrar sesión. Reservar, pagar y registrar siguen requiriendo conexión.
 */
const PREFIJO = 'odonto_offline:v1:';
const CLAVE_USUARIO = `${PREFIJO}usuario`;

/** Únicas consultas que pueden guardarse. */
export type RecursoOffline = 'perfil' | 'citas' | 'agenda';
const RECURSOS: readonly RecursoOffline[] = ['perfil', 'citas', 'agenda'];

type Copia<T> = { guardadoEn: number; datos: T };

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}
function escribir(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* almacenamiento lleno o no disponible: se sigue sin copia */
  }
}

/** El usuario dueño de las copias. Se fija con el perfil recibido del backend. */
export function fijarUsuarioOffline(id: string) {
  const anterior = leer(CLAVE_USUARIO);
  if (anterior && anterior !== id) borrarDatosOffline(); // otro usuario en el mismo teléfono
  escribir(CLAVE_USUARIO, id);
}

const claveDe = (recurso: RecursoOffline) => {
  const usuario = leer(CLAVE_USUARIO);
  return usuario ? `${PREFIJO}${usuario}:${recurso}` : null;
};

export function guardarCopia<T>(recurso: RecursoOffline, datos: T) {
  if (!RECURSOS.includes(recurso)) return;
  const clave = claveDe(recurso);
  if (clave) escribir(clave, JSON.stringify({ guardadoEn: Date.now(), datos } satisfies Copia<T>));
}

export function leerCopia<T>(recurso: RecursoOffline): Copia<T> | null {
  const clave = claveDe(recurso);
  const texto = clave ? leer(clave) : null;
  if (!texto) return null;
  try {
    return JSON.parse(texto) as Copia<T>;
  } catch {
    return null;
  }
}

export function borrarDatosOffline() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIJO)) localStorage.removeItem(k);
    }
  } catch {
    /* noop */
  }
  actualizar({ sinConexion: false, datosDe: null });
}

/* ───────── estado de conexión visible para la interfaz ───────── */
export type EstadoConexion = { sinConexion: boolean; datosDe: number | null };
let estado: EstadoConexion = { sinConexion: false, datosDe: null };
const oyentes = new Set<() => void>();

function actualizar(nuevo: EstadoConexion) {
  if (nuevo.sinConexion === estado.sinConexion && nuevo.datosDe === estado.datosDe) return;
  estado = nuevo;
  oyentes.forEach((f) => f());
}

/** Se mostró una copia guardada porque no hubo conexión. Conserva la fecha más antigua mostrada. */
export function avisarSinConexion(guardadoEn: number | null) {
  const datosDe = guardadoEn === null ? estado.datosDe : Math.min(estado.datosDe ?? guardadoEn, guardadoEn);
  actualizar({ sinConexion: true, datosDe });
}
export function avisarConexionRecuperada() {
  actualizar({ sinConexion: false, datosDe: null });
}

export function useEstadoConexion(): EstadoConexion {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => estado,
    () => estado,
  );
}
