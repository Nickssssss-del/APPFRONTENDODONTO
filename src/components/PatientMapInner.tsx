import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngExpression } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { EstadoUbicacion, PinOdontologo } from './PatientMap';

import { coordenadaValida } from '@/utils/coordenada';
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
    if (puntos.length === 1) map.setView(puntos[0], 14);
    else map.fitBounds(L.latLngBounds(puntos), { padding: [28, 28], maxZoom: 15 });
    map.invalidateSize();
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
}

export default function PatientMapInner({
  dentists, userLocation, ubicacion, onCentrar, onVerPerfil, onReservar, sinCoordenadas,
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
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
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
