import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import type { PayMethod, PayState } from './types';

interface Props {
  method: Exclude<PayMethod, 'card'>;
  guarantee: number;
  operationNumber: string;
  onOperationNumberChange: (v: string) => void;
  payState: PayState;
}

const QR_IMAGEN: Record<Exclude<PayMethod, 'card'>, string> = {
  yape: 'yapeqr.png',
  plin: 'plin-qr.png',
};

const STEPS: Record<Exclude<PayMethod, 'card'>, string[]> = {
  yape: [
    'Abre Yape en tu celular',
    'Toca el ícono de QR (escáner)',
    'Enfoca el código de abajo',
    'Confirma el monto S/ {{amount}}',
    'Ingresa el N° de operación',
  ],
  plin: [
    'Abre Plin en tu celular',
    'Selecciona "Pagar con QR"',
    'Escanea el código de abajo',
    'Confirma el monto S/ {{amount}}',
    'Ingresa el N° de operación',
  ],
};

export function QrPanel({ method, guarantee, operationNumber, onOperationNumberChange, payState }: Props) {
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate polling while the user hasn't typed the operation number yet
  useEffect(() => {
    if (payState !== 'idle') {
      setPolling(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (operationNumber.length === 6) {
      setPolling(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setPolling(true);
    // Poll every 5 s (integration point: replace with real API call)
    intervalRef.current = setInterval(() => {
      // INTEGRATION POINT: call /api/payments/status and update payState if confirmed
      // console.log('[QR poll] checking status…');
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [operationNumber, payState]);

  const steps = STEPS[method].map((s) =>
    s.replace('{{amount}}', guarantee.toFixed(2))
  );

  const appName = method === 'yape' ? 'Yape' : 'Plin';

  return (
    <div className="bg-white rounded-2xl border border-slatey-100 p-4 space-y-4">
      {/* QR de cobro (imágenes en public/pagos) */}
      <div className="flex flex-col items-center">
        <div className="w-56 rounded-2xl border border-slatey-100 bg-white p-2 mb-3 overflow-hidden shadow-xs">
          <img
            src={`${import.meta.env.BASE_URL}pagos/${QR_IMAGEN[method]}`}
            alt={`Código QR de ${method === 'yape' ? 'Yape' : 'Plin'} para pagar S/ ${guarantee.toFixed(2)}`}
            className="w-full h-auto max-h-64 object-contain select-none"
            draggable={false}
          />
        </div>
        <p className="text-xs text-slatey-500 text-center">
          Escanea con <strong>{appName}</strong> · S/{' '}
          <strong className="text-slatey-800">{guarantee.toFixed(2)}</strong>
        </p>
      </div>

      {/* Numbered steps */}
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-slatey-600">
            <span className="w-5 h-5 flex-shrink-0 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-[11px]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      {/* Polling indicator */}
      <AnimatePresence mode="wait">
        {polling && operationNumber.length < 6 && payState === 'idle' && (
          <motion.div
            key="polling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-slatey-500"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
            Esperando confirmación de {appName}…
          </motion.div>
        )}
        {payState === 'verified' && (
          <motion.div
            key="verified"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-success-700 font-semibold"
          >
            <CheckCircle2 className="w-4 h-4" />
            ¡Pago confirmado por {appName}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Operation number input */}
      <div>
        <label htmlFor="numero-operacion" className="block text-sm font-semibold text-slatey-700 mb-1.5">
          N° de operación
        </label>
        <input
          id="numero-operacion"
          type="text"
          inputMode="numeric"
          value={operationNumber}
          onChange={(e) =>
            onOperationNumberChange(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          placeholder="6 dígitos"
          maxLength={6}
          aria-describedby="op-hint"
          className="w-full px-4 py-3.5 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-500 focus:border-primary-400 focus:bg-white focus:outline-none text-center text-xl font-bold tracking-widest transition-all"
        />
        <p id="op-hint" className="mt-1 text-[11px] text-slatey-500 text-center">
          Aparece en la notificación de {appName} tras el pago
        </p>
      </div>

      {/* Optional receipt upload */}
      <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-xs font-medium cursor-pointer">
        <Upload className="w-4 h-4" />
        Adjuntar captura de pantalla (opcional)
        <input type="file" accept="image/*" className="sr-only" />
      </label>
    </div>
  );
}
