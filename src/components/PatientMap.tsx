import { Suspense, lazy } from 'react';

const PatientMapInner = lazy(() => import('./PatientMapInner'));

export type PinOdontologo = {
  id: string;
  nombre: string;
  consultorio?: string | null;
  direccion?: string | null;
  distrito?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  distanciaKm?: number | null;
};

export type EstadoUbicacion = 'cargando' | 'lista' | 'denegada' | 'no-disponible';

interface PatientMapProps {
  dentists: PinOdontologo[];
  userLocation?: { lat: number; lng: number } | null;
  ubicacion: EstadoUbicacion;
  onCentrar: () => void;
  onVerPerfil: (id: string) => void;
  onReservar: (id: string, nombre: string) => void;
  sinCoordenadas: number;
}

export default function PatientMap({
  dentists,
  userLocation = null,
  ubicacion,
  onCentrar,
  onVerPerfil,
  onReservar,
  sinCoordenadas,
}: PatientMapProps) {
  return (
    <Suspense fallback={<div className="flex h-[38dvh] min-h-[220px] max-h-80 w-full items-center justify-center rounded-2xl bg-slatey-50 text-sm text-slatey-500">Cargando mapa…</div>}>
      <PatientMapInner
        dentists={dentists}
        userLocation={userLocation}
        ubicacion={ubicacion}
        onCentrar={onCentrar}
        onVerPerfil={onVerPerfil}
        onReservar={onReservar}
        sinCoordenadas={sinCoordenadas}
      />
    </Suspense>
  );
}
