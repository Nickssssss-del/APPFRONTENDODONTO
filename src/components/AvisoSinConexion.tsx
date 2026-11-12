import { WifiOff } from 'lucide-react';
import { useEstadoConexion } from '@/lib/offline';

const formato = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

/** Franja visible mientras la app muestra datos guardados por falta de conexión. */
export default function AvisoSinConexion() {
  const { sinConexion, datosDe } = useEstadoConexion();
  if (!sinConexion) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-[60] flex items-center gap-2 bg-amber-100 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-xs font-medium text-amber-900"
    >
      <WifiOff className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>
        <strong>Sin conexión</strong>{datosDe ? ` · datos del ${formato.format(datosDe)}` : ''}
        <span className="block font-normal">Reservar, pagar y registrar requieren internet.</span>
      </span>
    </div>
  );
}
