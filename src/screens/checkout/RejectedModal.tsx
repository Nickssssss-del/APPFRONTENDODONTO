import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui';
import type { PayMethod } from './types';

interface Props {
  open: boolean;
  onRetry: () => void;
  onSwitchMethod: (m: PayMethod) => void;
  currentMethod: PayMethod;
  holdSeconds: number;
}

const METHOD_LABELS: Record<PayMethod, string> = {
  yape: 'Yape',
  plin: 'Plin',
  card: 'Tarjeta',
};

const ALTERNATIVES: Record<PayMethod, PayMethod[]> = {
  yape: ['plin', 'card'],
  plin: ['yape', 'card'],
  card: ['yape', 'plin'],
};

export function RejectedModal({ open, onRetry, onSwitchMethod, currentMethod, holdSeconds }: Props) {
  const alternatives = ALTERNATIVES[currentMethod];
  const mins = Math.ceil(holdSeconds / 60);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="reject-title"
          aria-describedby="reject-desc"
        >
          <div className="absolute inset-0 bg-slatey-900/50 backdrop-blur-sm" onClick={onRetry} />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <div className="p-6 flex flex-col items-center text-center gap-4">
              {/* Error icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center"
              >
                <XCircle className="w-9 h-9 text-error-500" />
              </motion.div>

              <div>
                <h3 id="reject-title" className="text-lg font-bold text-slatey-900 font-display">
                  El pago no fue aprobado
                </h3>
                <p id="reject-desc" className="text-sm text-slatey-500 mt-1">
                  {currentMethod === 'card'
                    ? 'Tu tarjeta fue rechazada. Verifica los datos o usa otro método.'
                    : `No se recibió la confirmación de ${METHOD_LABELS[currentMethod]}. Revisa el número de operación.`}
                </p>
              </div>

              {/* Hold notice */}
              <div className="flex items-start gap-2 w-full px-3 py-2.5 rounded-xl bg-accent-50 border border-accent-100 text-left">
                <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-accent-700">
                  Tu horario sigue reservado por{' '}
                  <strong>{mins} min{mins !== 1 ? 's' : ''} más</strong>. Tienes
                  tiempo para reintentar.
                </p>
              </div>

              {/* Primary action */}
              <Button
                fullWidth
                size="lg"
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar con {METHOD_LABELS[currentMethod]}
              </Button>

              {/* Switch method */}
              <p className="text-xs text-slatey-500 font-medium">O paga con otro método</p>
              <div className="grid grid-cols-2 gap-2 w-full">
                {alternatives.map((m) => (
                  <button
                    key={m}
                    onClick={() => onSwitchMethod(m)}
                    className="py-2.5 rounded-xl border-2 border-slatey-200 bg-white text-sm font-semibold text-slatey-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    Usar {METHOD_LABELS[m]}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slatey-400">
                ¿Sigues con problemas?{' '}
                <a
                  href="mailto:soporte@odontosystem.pe"
                  className="text-primary-600 underline"
                >
                  Escríbenos
                </a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

