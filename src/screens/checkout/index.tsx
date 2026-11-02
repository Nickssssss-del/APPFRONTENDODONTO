import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../storeHooks';
import { Button, Modal } from '../../components/ui';
import { configuracionPagos, pagarDeposito, reservarCita, type MetodoPago } from '@/api/citas';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import { segundosHasta } from '@/lib/format';

import { AppointmentSummary } from './AppointmentSummary';
import { MethodSelector } from './MethodSelector';
import { estadoMetodo } from './metodos';
import { QrPanel } from './QrPanel';
import { CardPanel } from './CardPanel';
import { TrustBadges } from './TrustBadges';
import { SuccessModal } from './SuccessModal';
import { RejectedModal } from './RejectedModal';
import { MercadoPagoBrick } from './MercadoPagoBrick';

import type { PayState, PayMethod } from './types';

const METODO_API: Record<PayMethod, MetodoPago> = { yape: 'YAPE', plin: 'PLIN', card: 'TARJETA' };

export default function CheckoutScreen() {
  const {
    setScreen,
    selectedTreatment,
    selectedDay,
    selectedTime,
    selectedDentistName,
    selectedDentistId,
    selectedSlotStart,
    activeCita,
    setActiveCita,
    setSelectedSlotStart,
    setSelectedTime,
    refreshAppointments,
  } = useApp();

  // Sin horario elegido ni cita pendiente no hay nada que pagar: vuelve al marketplace.
  useEffect(() => {
    if (!activeCita && !selectedSlotStart) setScreen('marketplace');
  }, [activeCita, selectedSlotStart, setScreen]);

  // ── Importes: los manda el backend (no se recalculan en el cliente) ──────────
  const price = activeCita?.precio ?? selectedTreatment.price;
  const guarantee = activeCita?.depositoRequerido ?? selectedTreatment.deposit ?? Math.round(price * 0.2);
  const balance = Math.max(0, price - guarantee);

  // ── Cuenta regresiva hasta pagar_antes_de (≈15 min); luego el turno se libera solo ──
  const pagarAntesDe = activeCita?.pagarAntesDe ?? null;
  const [restante, setRestante] = useState(() => segundosHasta(pagarAntesDe));
  const totalSeconds = activeCita?.pagarAntesDe && activeCita.creadoEn
    ? Math.max(60, Math.round((new Date(activeCita.pagarAntesDe).getTime() - new Date(activeCita.creadoEn).getTime()) / 1000))
    : 900;

  // ── Local state ──────────────────────────────────────────────────────────────
  // Modo de pagos y métodos disponibles (PLIN sale deshabilitado: "Próximamente")
  const config = useAsync(() => configuracionPagos(), []);
  const modoPagos = config.data?.modo ?? 'simulado';
  const [payMethod, setPayMethod] = useState<PayMethod>('yape');
  const [operationNumber, setOperationNumber] = useState('');
  const [payState, setPayState] = useState<PayState>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expirado, setExpirado] = useState(false);
  const [simulado, setSimulado] = useState(false);

  useEffect(() => {
    setRestante(segundosHasta(pagarAntesDe));
    if (!pagarAntesDe) return;
    const t = setInterval(() => {
      const r = segundosHasta(pagarAntesDe);
      setRestante(r);
      if (r <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [pagarAntesDe]);

  useEffect(() => {
    if (pagarAntesDe && restante <= 0 && payState !== 'verified' && payState !== 'processing') setExpirado(true);
  }, [restante, pagarAntesDe, payState]);

  const liberarYVolver = () => {
    setExpirado(false);
    setActiveCita(null);
    setSelectedSlotStart(null);
    setSelectedTime(null);
    setScreen('marketplace');
  };

  // ── Pago real: POST /api/citas/{id}/pagar (el backend solo recibe el método) ──
  // Los datos de tarjeta NUNCA salen del navegador hacia nuestro backend.
  const handlePay = async () => {
    if (payState === 'processing') return;
    setPayState('processing');
    setErrorMsg(null);
    let paso: 'reservar' | 'pagar' = 'reservar';
    try {
      // 1) Se reserva el turno justo ahora (si ya hay una cita pendiente, p. ej. tras un pago rechazado, se reutiliza).
      let cita = activeCita;
      if (!cita) {
        if (!selectedDentistId || !selectedSlotStart) throw new ApiError(400, 'Falta elegir odontólogo y horario.');
        cita = await reservarCita(selectedDentistId, selectedTreatment.id, selectedSlotStart);
        setActiveCita(cita);
      }
      // 2) Se paga el depósito. El backend solo recibe el método: los datos de tarjeta NUNCA salen del navegador.
      paso = 'pagar';
      const pago = await pagarDeposito(cita.id, METODO_API[payMethod]);

      // Manejo según el estado devuelto por el backend
      if (pago.estado === 'RECHAZADO') {
        setErrorMsg(pago.mensaje ?? 'El pago fue rechazado. Prueba con otro medio de pago.');
        setPayState('rejected');
        setShowRejected(true);
        // No tocar activeCita: la cita sigue PENDIENTE_PAGO y se reutiliza
        return;
      }

      if (pago.estado === 'PENDIENTE') {
        // Pago en confirmación: mostramos modal de éxito con texto de confirmación pendiente
        setActiveCita(pago.cita);
        setSimulado(pago.simulado);
        setPayState('verified');
        void refreshAppointments();
        setTimeout(() => setShowSuccess(true), 600);
        return;
      }

      // VERIFICADO (o cualquier otro estado considerado éxito)
      setActiveCita(pago.cita);
      setSimulado(pago.simulado);
      setPayState('verified');
      void refreshAppointments();
      setTimeout(() => setShowSuccess(true), 600);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo procesar el pago.';
      setErrorMsg(msg);
      if (e instanceof ApiError && e.status === 409) {
        // Si el mensaje indica "en confirmación", no marcamos el turno como expirado
        if (/en confirmaci[oó]n/i.test(msg)) {
          // Mostramos el mensaje pero dejamos la cita como está
          setPayState('idle');
          return;
        }
        // Caso normal de 409: turno ocupado o tiempo agotado
        if (paso === 'reservar') setSelectedSlotStart(null);
        setActiveCita(null);
        setPayState('idle');
        setExpirado(true);
      } else {
        setPayState('rejected');
        setShowRejected(true);
      }
    }
  };

  /** Procesa el token devuelto por el Brick de Mercado Pago */
  const processMercadoPagoPayment = async (_metodo: 'TARJETA', tokenData: { token: string; medioPagoId?: string }) => {
    if (payState === 'processing') return;
    setPayState('processing');
    setErrorMsg(null);
    let paso: 'reservar' | 'pagar' = 'reservar';
    try {
      // 1) Reservar turno si no existe (igual que handlePay)
      let cita = activeCita;
      if (!cita) {
        if (!selectedDentistId || !selectedSlotStart) throw new ApiError(400, 'Falta elegir odontólogo y horario.');
        cita = await reservarCita(selectedDentistId, selectedTreatment.id, selectedSlotStart);
        setActiveCita(cita);
      }
      // 2) Pagar con token
      paso = 'pagar';
      const pago = await pagarDeposito(cita.id, METODO_API[payMethod], tokenData);

      // Manejo según el estado devuelto por el backend (reutiliza lógica de handlePay)
      if (pago.estado === 'RECHAZADO') {
        setErrorMsg(pago.mensaje ?? 'El pago fue rechazado. Prueba con otro medio de pago.');
        setPayState('rejected');
        setShowRejected(true);
        return;
      }

      if (pago.estado === 'PENDIENTE') {
        setActiveCita(pago.cita);
        setSimulado(pago.simulado);
        setPayState('verified');
        void refreshAppointments();
        setTimeout(() => setShowSuccess(true), 600);
        return;
      }

      // VERIFICADO u otro éxito
      setActiveCita(pago.cita);
      setSimulado(pago.simulado);
      setPayState('verified');
      void refreshAppointments();
      setTimeout(() => setShowSuccess(true), 600);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo procesar el pago.';
      setErrorMsg(msg);
      if (e instanceof ApiError && e.status === 409) {
        if (/en confirmaci[oó]n/i.test(msg)) {
          setPayState('idle');
          return;
        }
        if (paso === 'reservar') setSelectedSlotStart(null);
        setActiveCita(null);
        setPayState('idle');
        setExpirado(true);
      } else {
        setPayState('rejected');
        setShowRejected(true);
      }
    }
  };

  const handleRetry = () => {
    setShowRejected(false);
    setErrorMsg(null);
    setPayState('idle');
    setOperationNumber('');
  };

  const handleSwitchMethod = (m: PayMethod) => {
    setShowRejected(false);
    setPayState('idle');
    setOperationNumber('');
    setPayMethod(m);
  };

  

  // Si el método elegido no está habilitado en el backend (p. ej. PLIN), vuelve a Yape
  useEffect(() => {
    if (!estadoMetodo(config.data?.metodos, payMethod).disponible) setPayMethod('yape');
  }, [config.data, payMethod]);

  // ── CTA guard ────────────────────────────────────────────────────────────────
  const isMercadoPagoCard = modoPagos === 'mercadopago' && payMethod === 'card';
  const qrReady = payMethod !== 'card' && operationNumber.length === 6;
  const cardReady = payMethod === 'card' && !isMercadoPagoCard; // CardPanel only
  const canPay = payState === 'idle' && (qrReady || cardReady);

  const time = selectedTime ?? '';

  return (
    <>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-slatey-50">
        {/* ── Top bar ─────────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 glass border-b border-slatey-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
            <button
              onClick={() => setScreen(activeCita ? 'misCitas' : 'marketplace')}
              aria-label="Volver"
              className="p-2 -ml-2 rounded-xl hover:bg-slatey-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slatey-700" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slatey-900 font-display">
                Pago del depósito
              </h2>
              <p className="text-xs text-slatey-500">Depósito de reserva · S/ {guarantee.toFixed(2)}</p>
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
              holdSeconds={restante}
              isHoldActive={restante > 0}
              totalSeconds={totalSeconds}
              guarantee={guarantee}
              balance={balance}
              dentistName={selectedDentistName || activeCita?.odontologo.nombre || 'Odontólogo'}
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
              metodos={config.data?.metodos}
            />
            {config.data?.modoPrueba && (
              <p className="-mt-2 rounded-xl bg-accent-50 px-3 py-2 text-[11px] font-medium text-accent-700">
                Modo de prueba: ningún cobro es real.
              </p>
            )}

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
                  {modoPagos === 'mercadopago' ? (
                    <MercadoPagoBrick
                      publicKey={config.data?.mercadopagoLlavePublica ?? ''}
                      amount={guarantee}
                      onToken={processMercadoPagoPayment}
                    />
                  ) : (
                    <CardPanel
                      modo={modoPagos}
                      disabled={payState === 'processing' || payState === 'verified'}
                    />
                  )}
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
                {errorMsg ?? 'El pago fue rechazado. Reintenta o elige otro método.'}
              </p>
            )}
            {!isMercadoPagoCard && (
              <>
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
                  <p className="text-center text-[11px] text-slatey-500 mt-2">
                    Ingresa el N° de operación de 6 dígitos para habilitar el pago
                  </p>
                )}
              </>
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
        dentistName={selectedDentistName || activeCita?.odontologo.nombre || 'Odontólogo'}
        pendingConfirmation={activeCita?.estado === 'PENDIENTE_CONFIRMACION'}
        simulated={simulado}
        startIso={activeCita?.inicio}
        endIso={activeCita?.fin}
        onClose={() => {
          setShowSuccess(false);
          setActiveCita(null);
          setSelectedSlotStart(null);
          setSelectedTime(null);
          setScreen('misCitas');
        }}
      />

      <RejectedModal
        open={showRejected}
        currentMethod={payMethod}
        holdSeconds={restante}
        message={errorMsg}
        onRetry={handleRetry}
        onSwitchMethod={handleSwitchMethod}
      />

      <Modal open={expirado} onClose={liberarYVolver} title="El tiempo para pagar terminó">
        <div className="space-y-4">
          <p className="text-sm text-slatey-600">
            {errorMsg ?? 'Pasaron los 15 minutos para pagar el depósito, así que el horario se liberó.'}
          </p>
          <Button fullWidth size="lg" onClick={liberarYVolver}>Elegir otro horario</Button>
        </div>
      </Modal>
    </>
  );
}

