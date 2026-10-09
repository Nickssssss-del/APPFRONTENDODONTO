import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp, DAY_LABELS } from '../../store';
import { Button } from '../../components/ui';

import { AppointmentSummary } from './AppointmentSummary';
import { MethodSelector } from './MethodSelector';
import { QrPanel } from './QrPanel';
import { CardPanel } from './CardPanel';
import { TrustBadges } from './TrustBadges';
import { SuccessModal } from './SuccessModal';
import { RejectedModal } from './RejectedModal';

import type { PayState, PayMethod, Provider, CardFields } from './types';

export default function CheckoutScreen() {
  const {
    setScreen,
    selectedTreatment,
    selectedDay,
    selectedTime,
    holdSeconds,
    isHoldActive,
    user,
    createAppointmentRequest,
  } = useApp();

  // ── Derived amounts ──────────────────────────────────────────────────────────
  const guarantee = Math.round(selectedTreatment.price * 0.2);
  const balance = selectedTreatment.price - guarantee;

  // ── Local state ──────────────────────────────────────────────────────────────
  const [provider] = useState<Provider>('culqi'); // Switch UI removed; set via env/config
  const [payMethod, setPayMethod] = useState<PayMethod>('yape');
  const [operationNumber, setOperationNumber] = useState('');
  const [payState, setPayState] = useState<PayState>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRejected, setShowRejected] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  /**
   * INTEGRATION POINT — replace with real payment gateway call.
   *
   * Culqi (QR):  POST /v1/charges with the QR operation reference.
   * Niubiz/Culqi (card): First tokenize via CardPanel.onReadyToTokenize,
   *   then POST /v1/charges with the returned token.
   *
   * The function must return true on success, false on any rejection.
   */
  const processPayment = useCallback(
    (_method: PayMethod, _opRef?: string): Promise<boolean> =>
      new Promise((resolve) => {
        setTimeout(() => resolve(Math.random() > 0.07), 1800);
      }),
    []
  );

  const handlePay = async () => {
    setPayState('processing');
    const opRef = payMethod !== 'card' ? operationNumber : undefined;
    const ok = await processPayment(payMethod, opRef);

    if (ok) {
      setPayState('verified');
      const dayLabel =
        DAY_LABELS.find((label) => selectedDay.startsWith(label)) ?? 'Lun';
      createAppointmentRequest({
        dentistId: '1',
        patientName: user.fullName || 'María González',
        patientDni: user.dni || '12345678',
        patientAge: user.age || '28',
        patientEmail: user.email,
        patientPhone: user.phone,
        treatment: selectedTreatment,
        dayLabel,
        selectedDay,
        selectedTime: selectedTime ?? '10:00',
      });
      setTimeout(() => setShowSuccess(true), 600);
    } else {
      setPayState('rejected');
      setShowRejected(true);
    }
  };

  const handleRetry = () => {
    setShowRejected(false);
    setPayState('idle');
    setOperationNumber('');
  };

  const handleSwitchMethod = (m: PayMethod) => {
    setShowRejected(false);
    setPayState('idle');
    setOperationNumber('');
    setPayMethod(m);
  };

  const handleCardTokenReady = (_fields: CardFields) => {
    // INTEGRATION POINT: pass fields to Culqi / Niubiz SDK for tokenization.
    // The raw number and CVV must NEVER be sent to your own backend directly.
    // Example (Culqi):
    //   Culqi.createToken(fields, (token) => setCardToken(token.id));
  };

  // ── CTA guard ────────────────────────────────────────────────────────────────
  const qrReady = payMethod !== 'card' && operationNumber.length === 6;
  const cardReady = payMethod === 'card'; // card readiness is validated inside CardPanel
  const canPay = payState === 'idle' && (qrReady || cardReady);

  const time = selectedTime ?? '10:00';

  return (
    <>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-slatey-50">
        {/* ── Top bar ─────────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 glass border-b border-slatey-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
            <button
              onClick={() => setScreen('marketplace')}
              aria-label="Volver al marketplace"
              className="p-2 -ml-2 rounded-xl hover:bg-slatey-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slatey-700" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slatey-900 font-display">
                Pago del depósito
              </h2>
              <p className="text-xs text-slatey-500">20% del precio · S/ {guarantee.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* ── Scrollable content ───────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-32">
            {/* Appointment summary (collapsible) */}
            <AppointmentSummary
              treatment={selectedTreatment}
              selectedDay={selectedDay}
              selectedTime={time}
              holdSeconds={holdSeconds}
              isHoldActive={isHoldActive}
              guarantee={guarantee}
              balance={balance}
            />

            {/* Method selector */}
            <MethodSelector
              value={payMethod}
              onChange={(m) => {
                setPayMethod(m);
                setOperationNumber('');
                setPayState('idle');
              }}
              disabled={payState === 'processing' || payState === 'verified'}
            />

            {/* Payment panel — animated transition */}
            <AnimatePresence mode="wait">
              {(payMethod === 'yape' || payMethod === 'plin') && (
                <motion.div
                  key={payMethod}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <QrPanel
                    method={payMethod}
                    guarantee={guarantee}
                    operationNumber={operationNumber}
                    onOperationNumberChange={setOperationNumber}
                    payState={payState}
                  />
                </motion.div>
              )}

              {payMethod === 'card' && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardPanel
                    provider={provider}
                    onReadyToTokenize={handleCardTokenReady}
                    disabled={payState === 'processing' || payState === 'verified'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust badges */}
            <TrustBadges />
          </div>
        </div>

        {/* ── Sticky CTA bar ───────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-slatey-100 bg-white/95 backdrop-blur-sm px-4 py-4 safe-area-bottom">
          <div className="max-w-md mx-auto">
            {payState === 'rejected' && (
              <p className="text-xs text-error-600 font-semibold text-center mb-2" role="alert">
                El pago fue rechazado. Reintenta o elige otro método.
              </p>
            )}
            <Button
              fullWidth
              size="lg"
              loading={payState === 'processing'}
              disabled={!canPay}
              onClick={handlePay}
            >
              {payState === 'processing' && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando…
                </>
              )}
              {payState === 'verified' && (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Depósito confirmado
                </>
              )}
              {(payState === 'idle' || payState === 'rejected') && (
                <>Pagar S/ {guarantee.toFixed(2)}</>
              )}
            </Button>
            {payMethod !== 'card' && operationNumber.length < 6 && payState === 'idle' && (
              <p className="text-center text-[11px] text-slatey-400 mt-2">
                Ingresa el N° de operación de 6 dígitos para habilitar el pago
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <SuccessModal
        open={showSuccess}
        treatment={selectedTreatment}
        selectedDay={selectedDay}
        selectedTime={time}
        guarantee={guarantee}
        balance={balance}
        onClose={() => {
          setShowSuccess(false);
          setScreen('patientDashboard');
        }}
      />

      <RejectedModal
        open={showRejected}
        currentMethod={payMethod}
        holdSeconds={holdSeconds}
        onRetry={handleRetry}
        onSwitchMethod={handleSwitchMethod}
      />
    </>
  );
}

