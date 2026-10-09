import { motion } from 'framer-motion';
import { Download, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { ReceiptRow } from './types';
import { EmptyState } from './States';

interface Props {
  receipts: ReceiptRow[];
  onReserve: () => void;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente de atención',
    icon: Clock,
    color: 'text-accent-600',
    bg: 'bg-accent-50',
    border: 'border-accent-100',
  },
  completed: {
    label: 'Atendida',
    icon: CheckCircle2,
    color: 'text-success-600',
    bg: 'bg-success-50',
    border: 'border-success-100',
  },
  cancelled: {
    label: 'Cancelada',
    icon: XCircle,
    color: 'text-error-500',
    bg: 'bg-error-50',
    border: 'border-error-100',
  },
};

export function ComprobantesTab({ receipts, onReserve }: Props) {
  if (receipts.length === 0) return <EmptyState onReserve={onReserve} />;

  const total = receipts
    .filter((r) => r.status === 'completed')
    .reduce((acc, r) => acc + r.amount, 0);

  return (
    <div
      id="panel-comprobantes"
      role="tabpanel"
      aria-labelledby="tab-comprobantes"
      className="p-4 space-y-4"
    >
      {/* Summary banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-primary-50 border border-primary-100">
        <div>
          <p className="text-xs text-primary-700 font-semibold">Total pagado (atendidas)</p>
          <p className="text-xl font-extrabold text-primary-600">S/ {total.toFixed(2)}</p>
        </div>
        <span className="text-3xl" aria-hidden="true">🧾</span>
      </div>

      {/* Receipt list */}
      <div className="space-y-3">
        {receipts.map((r, idx) => {
          const st = STATUS_CONFIG[r.status];
          const Icon = st.icon;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slatey-100 overflow-hidden"
            >
              {/* Status stripe */}
              <div className={`flex items-center gap-2 px-4 py-2 ${st.bg} border-b ${st.border}`}>
                <Icon className={`w-3.5 h-3.5 ${st.color}`} />
                <span className={`text-xs font-bold ${st.color}`}>{st.label}</span>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slatey-900 leading-tight">{r.treatment}</p>
                    <p className="text-xs text-slatey-500 mt-0.5">{r.dentistName}</p>
                    <p className="text-xs text-slatey-400">{r.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-extrabold text-slatey-900">S/ {r.amount.toFixed(2)}</p>
                    {r.depositPaid > 0 && (
                      <p className="text-[11px] text-success-600 font-semibold">
                        Depósito: S/ {r.depositPaid.toFixed(2)}
                      </p>
                    )}
                    {r.depositPaid > 0 && r.status === 'completed' && (
                      <p className="text-[11px] text-slatey-400">
                        Saldo: S/ {(r.amount - r.depositPaid).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Download */}
                <button
                  onClick={() => {
                    // INTEGRATION POINT: generate PDF receipt (jsPDF / backend /api/receipts/:id/pdf)
                    alert(`Descargando comprobante de ${r.treatment} (integración pendiente)`);
                  }}
                  disabled={r.status === 'cancelled'}
                  aria-label={`Descargar comprobante de ${r.treatment}`}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  {r.status === 'cancelled' ? 'Sin comprobante' : 'Descargar PDF'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[11px] text-slatey-400 text-center pb-2">
        Los comprobantes oficiales (boleta/factura) los emite el odontólogo al finalizar la cita.
      </p>
    </div>
  );
}

