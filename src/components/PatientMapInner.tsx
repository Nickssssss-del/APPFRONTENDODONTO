import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngExpression } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { EstadoUbicacion, PinOdontologo } from './PatientMap';

import { coordenadaValida } from '@/utils/coordenada';
import { obtenerRuta, resumenRuta, urlComoLlegar, type Ruta } from '@/lib/rutas';
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: never })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const iconoPaciente = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#0f766e;border:3px solid #fff;outline:2px solid #0f766e"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function distanciaKm(a: { lat: number; lng: number }, lat: number, lng: number): number {
  const r = 6371;
  const dLat = ((lat - a.lat) * Math.PI) / 180;
  const dLng = ((lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos((a.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(r * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
}

function Encuadre({ puntos }: { puntos: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (puntos.length === 0) return;
    // Sin animación: los puntos llegan en tandas (tu ubicación, luego los consultorios) y Leaflet descarta un
    // encuadre pedido mientras aún anima el anterior, dejando pines fuera de la vista.
    map.invalidateSize();
    if (puntos.length === 1) map.setView(puntos[0], 14, { animate: false });
    else map.fitBounds(L.latLngBounds(puntos), { padding: [28, 28], maxZoom: 15, animate: false });
  }, [map, puntos]);
  return null;
}

/** Al llegar la ruta, encuadra el recorrido y todos los pines (la ruta puede salir del área de los pines). */
function EncuadreRuta({ puntos }: { puntos: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLngBounds(puntos), { padding: [36, 36], maxZoom: 16, animate: false });
  }, [map, puntos]);
  return null;
}

interface Props {
  dentists: PinOdontologo[];
  userLocation: { lat: number; lng: number } | null;
  ubicacion: EstadoUbicacion;
  onCentrar: () => void;
  onVerPerfil: (id: string) => void;
  onReservar: (id: string, nombre: string) => void;
  sinCoordenadas: number;
  masCercanoId?: string | null;
}

export default function PatientMapInner({
  dentists, userLocation, ubicacion, onCentrar, onVerPerfil, onReservar, sinCoordenadas, masCercanoId = null,
}: Props) {
  const pines = useMemo(() => {
    const vistos = new Set<string>();
    return dentists.flatMap((d) => {
      const lat = d.latitud;
      const lng = d.longitud;
      if (vistos.has(d.id) || !coordenadaValida(lat, lng) || lat == null || lng == null) return [];
      vistos.add(d.id);
      const km = d.distanciaKm ?? (userLocation ? distanciaKm(userLocation, lat, lng) : null);
      return [{ ...d, distanciaKm: km }];
    }).sort((a, b) => (a.distanciaKm ?? 999) - (b.distanciaKm ?? 999));
  }, [dentists, userLocation]);

  const puntos = useMemo<LatLngExpression[]>(() => {
    const lista: LatLngExpression[] = pines.map((d) => [d.latitud!, d.longitud!]);
    if (userLocation) lista.push([userLocation.lat, userLocation.lng]);
    return lista;
  }, [pines, userLocation]);

  // Ruta real por las calles hasta el más cercano. Si el servicio falla, línea recta de referencia.
  const destinoLinea = userLocation && masCercanoId ? pines.find((d) => d.id === masCercanoId) : undefined;
  const claveRuta = userLocation && destinoLinea
    ? `${userLocation.lat},${userLocation.lng}>${destinoLinea.latitud},${destinoLinea.longitud}` : null;
  const [ruta, setRuta] = useState<{ clave: string; ruta: Ruta | null; error: boolean } | null>(null);
  useEffect(() => {
    if (!claveRuta || !userLocation || !destinoLinea) return;
    const ctrl = new AbortController();
    obtenerRuta(userLocation, { lat: destinoLinea.latitud!, lng: destinoLinea.longitud! }, ctrl.signal)
      .then((r) => setRuta({ clave: claveRuta, ruta: r, error: false }))
      .catch((e: Error) => { if (e.name !== 'AbortError') setRuta({ clave: claveRuta, ruta: null, error: true }); });
    return () => ctrl.abort();
    // claveRuta resume origen y destino: evita repetir la petición en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveRuta]);
  const rutaActual = ruta && ruta.clave === claveRuta ? ruta : null;
  const cargandoRuta = !!claveRuta && !rutaActual;
  const rutaReal = rutaActual?.ruta ?? null;
  const puntosConRuta = useMemo<LatLngExpression[]>(() => [...puntos, ...(rutaReal?.puntos ?? [])], [puntos, rutaReal]);

  const avisoUbicacion = ubicacion === 'cargando'
    ? 'Buscando tu ubicación…'
    : ubicacion === 'denegada'
      ? 'Permiso de ubicación denegado. Puedes ver los consultorios que tengan coordenadas, sin ordenar por cercanía.'
      : ubicacion === 'no-disponible'
        ? 'No se pudo obtener tu ubicación. El mapa muestra solo consultorios con coordenadas registradas.'
        : null;

  return (
    <div className="space-y-2">
      <div className="relative h-[38dvh] min-h-[220px] max-h-80 overflow-hidden rounded-2xl border border-slatey-100 bg-slatey-50">
        {puntos.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slatey-500">
            {ubicacion === 'cargando' ? 'Buscando tu ubicación…' : 'No hay consultorios con coordenadas para mostrar en el mapa.'}
          </div>
        ) : (
          <MapContainer
            center={userLocation ? [userLocation.lat, userLocation.lng] : (puntos[0] as LatLngExpression)}
            zoom={13}
            className="h-full w-full"
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Encuadre puntos={puntos} />
            {rutaReal && (
              <>
                {/* Base clara + trazo animado encima: se lee como «camino hacia el consultorio». */}
                <Polyline positions={rutaReal.puntos} pathOptions={{ color: '#99f6e4', weight: 9, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
                {/* className va como prop: react-leaflet no lo toma dentro de pathOptions. */}
                <Polyline className="ruta-animada" positions={rutaReal.puntos} pathOptions={{ color: '#0f766e', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
                <EncuadreRuta puntos={puntosConRuta} />
              </>
            )}
            {userLocation && destinoLinea && rutaActual?.error && (
              <Polyline
                positions={[[userLocation.lat, userLocation.lng], [destinoLinea.latitud!, destinoLinea.longitud!]]}
                pathOptions={{ color: '#0f766e', weight: 3, dashArray: '6 8', opacity: 0.85 }}
              />
            )}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={iconoPaciente}>
                <Popup>Tu ubicación</Popup>
              </Marker>
            )}
            {pines.map((d) => (
              <Marker key={d.id} position={[d.latitud!, d.longitud!]}>
                <Popup>
                  <div className="min-w-[180px] space-y-1 text-sm">
                    <strong className="block break-words">{d.nombre}</strong>
                    <span className="block break-words text-slate-600">
                      {[d.consultorio, d.direccion, d.distrito].filter(Boolean).join(' · ') || 'Sin dirección registrada'}
                    </span>
                    {d.distanciaKm != null && <span className="block text-xs">{d.distanciaKm.toFixed(1)} km de ti</span>}
                    <div className="flex gap-2 pt-1">
                      <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => onVerPerfil(d.id)}>Ver perfil</button>
                      <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => onReservar(d.id, d.nombre)}>Reservar</button>
                    </div>
                    <a
                      href={urlComoLlegar(d, userLocation) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block pt-1 text-xs font-bold text-teal-700"
                    >
                      Cómo llegar →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        {destinoLinea && (rutaReal || cargandoRuta) && (
          <div className="absolute right-3 top-3 z-[500] rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-slatey-800 shadow-md" aria-live="polite">
            {rutaReal ? `🚗 ${resumenRuta(rutaReal)}` : 'Calculando ruta…'}
          </div>
        )}
        <button
          type="button"
          onClick={onCentrar}
          className="absolute bottom-3 left-3 z-[500] rounded-xl bg-white px-3 py-2 text-xs font-bold text-slatey-800 shadow-md"
        >
          {ubicacion === 'cargando' ? 'Ubicando…' : 'Mi ubicación'}
        </button>
      </div>
      {avisoUbicacion && <p className="px-1 text-xs text-slatey-500">{avisoUbicacion}</p>}
      {destinoLinea && rutaReal && (
        <p className="px-1 text-xs text-slatey-500">
          Ruta en auto hasta el más cercano ({destinoLinea.nombre}). «Cómo llegar» abre la navegación paso a paso en Google Maps.
        </p>
      )}
      {destinoLinea && rutaActual?.error && (
        <p className="px-1 text-xs text-slatey-500">
          No se pudo calcular la ruta ahora; la línea punteada es solo una referencia en línea recta hasta {destinoLinea.nombre}. «Cómo llegar» abre la ruta en Google Maps.
        </p>
      )}
      {sinCoordenadas > 0 && (
        <p className="px-1 text-xs text-slatey-500">
          {sinCoordenadas === 1
            ? '1 odontólogo no aparece en el mapa porque su consultorio no tiene coordenadas.'
            : `${sinCoordenadas} odontólogos no aparecen en el mapa porque su consultorio no tiene coordenadas.`}
        </p>
      )}
    </div>
  );
}
