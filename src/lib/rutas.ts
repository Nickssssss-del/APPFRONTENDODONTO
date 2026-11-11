import { coordenadaValida } from '@/utils/coordenada';

type Punto = { lat: number; lng: number };

/**
 * Enlace de Google Maps con la ruta hacia un consultorio (Maps URLs, no requiere clave de API).
 * En Android abre la app de Google Maps si está instalada; si no, el navegador.
 * Sin origen, Google Maps usa la ubicación actual del teléfono.
 * Sin coordenadas válidas del consultorio, usa su dirección como texto.
 */
export function urlComoLlegar(destino: {
  latitud?: number | null;
  longitud?: number | null;
  consultorio?: string | null;
  direccion?: string | null;
  distrito?: string | null;
}, origen?: Punto | null): string | null {
  const params = new URLSearchParams({ api: '1' });
  if (origen && coordenadaValida(origen.lat, origen.lng)) params.set('origin', `${origen.lat},${origen.lng}`);

  if (coordenadaValida(destino.latitud, destino.longitud)) {
    params.set('destination', `${destino.latitud},${destino.longitud}`);
  } else {
    const texto = [destino.consultorio, destino.direccion, destino.distrito].filter(Boolean).join(' ');
    if (!texto) return null;
    params.set('destination', `${texto} Lima`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/* ───────── Ruta real por las calles (OSRM) ───────── */

/**
 * Servidor OSRM (Open Source Routing Machine, datos de OpenStreetMap). Por defecto el servidor público de
 * demostración: sin clave, pero con uso limitado (≈1 petición/s, no apto para mucho tráfico). Para producción,
 * define VITE_RUTAS_URL con un servidor OSRM propio o de un proveedor.
 */
export const RUTAS_URL: string = (import.meta.env.VITE_RUTAS_URL ?? 'https://router.project-osrm.org').replace(/\/$/, '');

export type Ruta = {
  /** Puntos [lat, lng] del recorrido por las calles. */
  puntos: [number, number][];
  distanciaM: number;
  duracionS: number;
};

type RespuestaOsrm = {
  code: string;
  routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
};

/** Ruta en auto desde `origen` hasta `destino`. Lanza un Error si el servicio no responde o no hay ruta. */
export async function obtenerRuta(origen: Punto, destino: Punto, signal?: AbortSignal): Promise<Ruta> {
  const tramo = `${origen.lng},${origen.lat};${destino.lng},${destino.lat}`;
  const res = await fetch(`${RUTAS_URL}/route/v1/driving/${tramo}?overview=full&geometries=geojson`, { signal });
  if (!res.ok) throw new Error(`Servicio de rutas: HTTP ${res.status}`);
  const data = (await res.json()) as RespuestaOsrm;
  const r = data.routes?.[0];
  if (data.code !== 'Ok' || !r || r.geometry.coordinates.length < 2) throw new Error('No se encontró una ruta');
  return {
    // GeoJSON viene como [lng, lat]; Leaflet usa [lat, lng].
    puntos: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanciaM: r.distance,
    duracionS: r.duration,
  };
}

/** «2,3 km · 8 min» */
export function resumenRuta(r: Pick<Ruta, 'distanciaM' | 'duracionS'>): string {
  const km = (r.distanciaM / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const min = Math.max(1, Math.round(r.duracionS / 60));
  return `${km} km · ${min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`}`;
}
