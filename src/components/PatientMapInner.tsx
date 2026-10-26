import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Map as LeafletMap } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons for Leaflet 1.7+
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: never })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface DentistMapItem {
  id: string;
  nombre: string;
  consultorio?: string | null;
  distrito?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  calificacion?: number | null;
  totalResenas?: number | null;
}

interface PatientMapInnerProps {
  dentists: DentistMapItem[];
  center: { lat: number; lng: number };
  zoom: number;
}

export default function PatientMapInner({ dentists, center, zoom }: PatientMapInnerProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  const validDentists = dentists.filter(
    (d) => typeof d.latitud === 'number' && typeof d.longitud === 'number' && d.latitud !== null && d.longitud !== null
  );

  return (
    <MapContainer
      ref={mapRef}
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="rounded-2xl"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validDentists.map((d) => (
        <Marker key={d.id} position={[d.latitud!, d.longitud!]}>
          <Popup>
            <div className="text-sm">
              <strong>{d.nombre}</strong>
              <br />
              {d.consultorio && <span>{d.consultorio}</span>}
              {d.distrito && <span className="ml-1">· {d.distrito}</span>}
              {d.calificacion !== null && d.calificacion !== undefined && (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <span>★ {d.calificacion.toFixed(1)}</span>
                  {d.totalResenas && <span>({d.totalResenas} reseñas)</span>}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}