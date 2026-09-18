import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, FileText, ShieldCheck, Upload, CreditCard,
  Calendar, Clock, AlertCircle, Check, XCircle, Loader2, PartyPopper,
} from 'lucide-react';
import { useApp, formatTime, DAY_LABELS } from '../store';
import { Button, Badge, Modal } from '../components/ui';
import type { PaymentMethod } from '../types';

type PayState = 'idle' | 'processing' | 'success' | 'error';

export default function Checkout() {
  const { setScreen, selectedTreatment, selectedDay, selectedTime, holdSeconds, isHoldActive, user, createAppointmentRequest } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yape');
  const [operationNumber, setOperationNumber] = useState('');
  const [payState, setPayState] = useState<PayState>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const treatmentPrice = selectedTreatment.price;
  const guarantee = 20;
  const balance = treatmentPrice - guarantee;

  const handlePay = () => {
    setPayState('processing');
    setTimeout(() => {
      if (Math.random() > 0.15) {
        setPayState('success');
        const dayLabel = DAY_LABELS.find((label) => selectedDay.startsWith(label)) || 'Lun';
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
          selectedTime: selectedTime || '10:00',
        });
        setTimeout(() => setShowSuccess(true), 600);
      } else {
        setPayState('error');
        setShowError(true);
      }
    }, 2500);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setScreen('patientDashboard');
  };

  const handleErrorClose = () => {
    setShowError(false);
    setPayState('idle');
  };

  const paymentMethods: { id: PaymentMethod; label: string; emoji: string }[] = [
    { id: 'yape', label: 'Yape', emoji: '📱' },
    { id: 'plin', label: 'Plin', emoji: '💸' },
    { id: 'card', label: 'Tarjeta', emoji: '💳' },
  ];

  return (
    <div className="min-h-screen bg-slatey-50">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-slatey-100">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <button onClick={() => setScreen('marketplace')} className="p-2 -ml-2 rounded-xl hover:bg-slatey-100">
            <ArrowLeft className="w-5 h-5 text-slatey-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slatey-900 font-display">Confirmar Reserva</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="neutral" size="sm">
                <CreditCard className="w-3 h-3" /> Pasarela
              </Badge>
              <Badge variant="primary" size="sm">
                <Calendar className="w-3 h-3" /> Google Calendar
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Hold Timer */}
        {isHoldActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent-50 border border-accent-200"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#FDE68A" strokeWidth="3" />
                <circle
                  cx="20" cy="20" r="16" fill="none" stroke="#F59E0B" strokeWidth="3"
                  strokeDasharray={`${(holdSeconds / 600) * 100.5} 100.5`}
                  strokeLinecap="round"
                />
              </svg>
              <Clock className="w-4 h-4 text-accent-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-accent-700">Tu horario está reservado temporalmente</p>
              <p className="text-xs text-accent-600">Completa el pago antes de que expire: <span className="font-bold">{formatTime(holdSeconds)}</span></p>
            </div>
          </motion.div>
        )}

        {/* Patient verified badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-success-50 border border-success-100"
        >
          <div className="w-9 h-9 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-success-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-success-700">Identidad verificada</p>
            <p className="text-xs text-success-600">{user.fullName || 'María González'} · DNI: {user.dni || '12345678'}</p>
          </div>
        </motion.div>

        {/* Appointment Summary */}
        <div className="bg-white rounded-2xl p-4 border border-slatey-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slatey-900 text-sm">{selectedTreatment.name}</h3>
              <p className="text-xs text-slatey-500">Dr. Carlos Mendoza · Lun 15, 10:00 AM</p>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slatey-100">
          <h3 className="text-sm font-bold text-slatey-900 mb-4">Resumen de precios</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slatey-500">Tratamiento</span>
              <span className="font-semibold text-slatey-900">S/ {treatmentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slatey-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success-500" />
                Garantía hoy
              </span>
              <span className="font-semibold text-success-600">S/ {guarantee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slatey-500">Saldo presencial en clínica</span>
              <span className="font-semibold text-slatey-900">S/ {balance.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slatey-100" />
            <div className="flex justify-between">
              <span className="font-bold text-slatey-900">Total a pagar hoy</span>
              <span className="font-extrabold text-primary-600 text-lg">S/ {guarantee.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h3 className="text-sm font-bold text-slatey-900 mb-3 px-1">Método de pago</h3>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((m) => {
              const selected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${selected ? 'border-primary-400 bg-primary-50/50' : 'border-slatey-200 bg-white'}`}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-2xl">{m.emoji}</span>
                  <span className={`text-xs font-semibold ${selected ? 'text-primary-700' : 'text-slatey-600'}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Detail */}
        <AnimatePresence mode="wait">
          {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl p-5 border border-slatey-100 overflow-hidden"
            >
              <div className="flex flex-col items-center">
                <div className="w-44 h-44 bg-slatey-900 rounded-2xl p-3 mb-3 relative overflow-hidden">
                  <div className="w-full h-full grid grid-cols-8 gap-0.5">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{ background: Math.random() > 0.45 ? 'white' : '#0F172A' }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-white p-1.5">
                    <div className="w-full h-full rounded-md bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                      {paymentMethod === 'yape' ? 'Y' : 'P'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slatey-500 text-center mb-4">
                  Escanea el QR con {paymentMethod === 'yape' ? 'Yape' : 'Plin'} para pagar S/ {guarantee.toFixed(2)}
                </p>
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slatey-700 mb-1.5">
                    N° de Operación (6 dígitos)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={operationNumber}
                    onChange={(e) => setOperationNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none text-center text-lg font-bold tracking-widest"
                  />
                  <button className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    Subir comprobante de pago (opcional)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {paymentMethod === 'card' && (
            <motion.div
              key="card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl p-5 border border-slatey-100 overflow-hidden space-y-3"
            >
              <div>
                <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Número de tarjeta</label>
                <input
                  type="text"
                  placeholder="4111 1111 1111 1111"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slatey-200 bg-slatey-50 focus:border-primary-400 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Vencimiento</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slatey-200 bg-slatey-50 focus:border-primary-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slatey-700 mb-1.5">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slatey-200 bg-slatey-50 focus:border-primary-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-primary-50 border border-primary-100">
            <FileText className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary-800 leading-relaxed">
              El comprobante (boleta/factura) por el total de tu atención será emitido directamente por el odontólogo al finalizar la cita.
            </p>
          </div>
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-success-50 border border-success-100">
            <ShieldCheck className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-success-800 leading-relaxed">
              Pago seguro · Garantía 100% reembolsable si cancelas con 24h de anticipación.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="pb-8 pt-2">
          <Button
            fullWidth
            size="lg"
            loading={payState === 'processing'}
            disabled={payState !== 'idle' || (paymentMethod !== 'card' && operationNumber.length < 6)}
            onClick={handlePay}
          >
            {payState === 'processing' ? (
              <>Procesando pago...</>
            ) : payState === 'success' ? (
              <>
                <CheckCircle2 className="w-5 h-5" /> Solicitud enviada
              </>
            ) : (
                <>Pagar S/ {guarantee.toFixed(2)} y Solicitar Cita</>
            )}
          </Button>
        </div>
      </div>

      {/* Success Modal with celebration animation */}
      <Modal open={showSuccess} onClose={handleSuccessClose} className="!sm:max-w-sm">
        <div className="flex flex-col items-center text-center pt-2 relative overflow-hidden">
          {/* Confetti particles */}
          {showSuccess && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, y: -20, x: Math.random() * 300 }}
                  animate={{ opacity: 0, y: 400, rotate: Math.random() * 360 }}
                  transition={{ duration: 1.5, delay: i * 0.05, ease: 'easeOut' }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#0D9488', '#F59E0B', '#22C55E', '#3B82F6', '#EF4444'][i % 5],
                    left: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mb-5 relative z-10"
          >
            <CheckCircle2 className="w-11 h-11 text-success-500" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-slatey-900 font-display mb-2 relative z-10"
          >
            ¡Solicitud enviada!
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-slatey-500 mb-6 relative z-10"
          >
            Tu solicitud con el Dr. Carlos Mendoza fue enviada. El odontólogo debe confirmarla antes de que quede reservada.
          </motion.p>
          <div className="w-full space-y-2 mb-6 relative z-10">
            <div className="flex justify-between text-sm">
              <span className="text-slatey-500">Garantía pagada</span>
              <span className="font-semibold text-success-600">S/ {guarantee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slatey-500">Saldo en clínica</span>
              <span className="font-semibold text-slatey-900">S/ {balance.toFixed(2)}</span>
            </div>
          </div>
          <Button fullWidth size="lg" onClick={handleSuccessClose} className="relative z-10">
            Ver mi cita
          </Button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal open={showError} onClose={handleErrorClose} className="!sm:max-w-sm">
        <div className="flex flex-col items-center text-center pt-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-error-50 flex items-center justify-center mb-5"
          >
            <XCircle className="w-11 h-11 text-error-500" />
          </motion.div>
          <h3 className="text-xl font-bold text-slatey-900 font-display mb-2">El pago no fue exitoso</h3>
          <p className="text-sm text-slatey-500 mb-4">
            No se pudo procesar el pago. Verifica el número de operación o intenta con otro método de pago.
          </p>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slatey-100 mb-6 w-full">
            <AlertCircle className="w-4 h-4 text-slatey-500 flex-shrink-0" />
            <p className="text-xs text-slatey-600">
              Si el problema persiste, contacta a soporte@odontosystem.pe
            </p>
          </div>
          <div className="w-full space-y-3">
            <Button fullWidth size="lg" onClick={handleErrorClose}>
              Intentar de nuevo
            </Button>
            <button
              onClick={() => { handleErrorClose(); setPaymentMethod('card'); }}
              className="w-full text-sm text-primary-600 font-semibold hover:text-primary-700"
            >
              Pagar con tarjeta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
