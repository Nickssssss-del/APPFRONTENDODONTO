import { Suspense, lazy } from 'react';

const PatientMapInner = lazy(() => import('./PatientMapInner'));

interface PatientMapProps {
  dentists: Array<{
    id: string;
    nombre: string;
    consultorio?: string | null;
    distrito?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    calificacion?: number | null;
    totalResenas?: number | null;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function PatientMap({ dentists, center = { lat: -12.0464, lng: -77.0428 }, zoom = 12 }: PatientMapProps) {
  return (
    <Suspense fallback={<div className="h-64 w-full flex items-center justify-center bg-slatey-50 rounded-2xl">Cargando mapa…</div>}>
      <PatientMapInner dentists={dentists} center={center} zoom={zoom} />
    </Suspense>
  );
}