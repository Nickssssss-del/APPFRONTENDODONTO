import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import { ApiError } from '@/api/http';
import { descargarConstancia, guardarArchivo } from '@/api/panel';
import type { CitaApi } from '@/api/citas';
import { diaLima, soles, ETIQUETA_ESTADO } from '@/lib/format';
import { EmptyState } from './States';

interface Props {
  citas: CitaApi[];
  onReserve: () => void;
}

/** Constancia de pago del depósito (PDF): GET /api/citas/{id}/constancia. No es boleta ni factura. */
export function ComprobantesTab({ citas, onReserve }: Props) {
  const [bajando, setBajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const conDeposito = citas.filter((c) => c.estado !== 'PENDIENTE_PAGO');

  if (conDeposito.length === 0) return <EmptyState onReserve={onReserve} />;

  const descargar = async (c: CitaApi) => {
    if (bajando) return;
    setBajando(c.id);
    setError(null);
    try {
      guardarArchivo(await descargarConstancia(c.id), `constancia-${c.id.slice(0, 8)}.pdf`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo descargar la constancia.');
    } finally {
      setBajando(null);
    }
  };

  return (
    <div id="panel-comprobantes" role="tabpanel" aria-labelledby="tab-comprobantes" className="p-4 space-y-4">
      {error && <p role="alert" className="text-xs font-medium text-error-600">{error}</p>}
      <div className="space-y-3">
        {conDeposito.map((c, idx) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 8) * 0.05 }} className="bg-white rounded-2xl border border-slatey-100 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slatey-900 leading-tight">{c.servicio.titulo}</p>
                <p className="text-xs text-slatey-500 mt-0.5">{c.odontologo.nombre}</p>
                <p className="text-xs text-slatey-400">{diaLima(c.inicio)} · {ETIQUETA_ESTADO[c.estado]}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-extrabold text-slatey-900">{soles(c.precio)}</p>
                <p className="text-[11px] text-success-600 font-semibold">Depósito: {soles(c.depositoRequerido)}</p>
              </div>
            </div>
            <button
              onClick={() => descargar(c)}
              disabled={bajando === c.id}
              aria-label={`Descargar constancia de ${c.servicio.titulo}`}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-xs font-semibold disabled:opacity-60"
            >
              {bajando === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Descargar constancia (PDF)
            </button>
          </motion.div>
        ))}
      </div>
      <p className="text-[11px] text-slatey-400 text-center pb-2">La constancia acredita el pago del depósito. La boleta o factura del servicio la emite el odontólogo.</p>
    </div>
  );
}
