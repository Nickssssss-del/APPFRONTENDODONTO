import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, Calendar, Share2 } from 'lucide-react';
import { Button } from '../../components/ui';
import type { Treatment } from '../../types';
import { DENTIST_NAME } from '../../lib/dentistData';

interface Props {
  open: boolean;
  treatment: Treatment;
  selectedDay: string;
  selectedTime: string;
  guarantee: number;
  balance: number;
  onClose: () => void;
}

/** Check SVG path animation */
function AnimatedCheck() {
  return (
    <motion.svg
      viewBox="0 0 52 52"
      className="w-14 h-14 text-success-500"
      fill="none"
    >
      <motion.circle
        cx="26"
        cy="26"
        r="25"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-success-200"
      />
      <motion.path
        d="M14 26l8 8 16-16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}

/** Confetti burst */
function Confetti() {
  const COLORS = ['#0D9488', '#F59E0B', '#22C55E', '#6366F1', '#EC4899'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, y: -10, x: (i % 6) * 55 }}
          animate={{ opacity: 0, y: 380, rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 1.6, delay: i * 0.04, ease: 'easeOut' }}
          className="absolute w-2.5 h-1.5 rounded-sm"
          style={{
            backgroundColor: COLORS[i % COLORS.length],
            left: `${(i * 17) % 100}%`,
          }}
        />
      ))}
    </div>
  );
}

export function SuccessModal({
  open,
  treatment,
  selectedDay,
  selectedTime,
  guarantee,
  balance,
  onClose,
}: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => closeBtnRef.current?.focus(), 700);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleAddToCalendar = () => {
    // INTEGRATION POINT: Build Google Calendar / Apple Calendar deep-link.
    // Example (Google):
    // const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...`;
    // window.open(url, '_blank');
    alert('Agregar al calendario (integración pendiente)');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Reservé mi cita con el Dr. ${DENTIST_NAME}! 🦷\n` +
        `📅 ${selectedDay} a las ${selectedTime}\n` +
        `Servicio: ${treatment.name}\n` +
        `Descarga OdontoSystem y reserva la tuya.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownload = () => {
    // INTEGRATION POINT: generate PDF receipt via backend or jsPDF.
    alert('Descargando comprobante (integración pendiente)');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div className="absolute inset-0 bg-slatey-900/50 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-hide"
          >
            <Confetti />
            <div className="p-6 flex flex-col items-center text-center gap-4 relative z-10">
              {/* Animated check */}
              <AnimatedCheck />

              <div>
                <h3
                  id="success-title"
                  className="text-xl font-bold text-slatey-900 font-display"
                >
                  ¡Depósito confirmado!
                </h3>
                <p className="text-sm text-slatey-500 mt-1">
                  Tu horario está reservado. El Dr.{' '}
                  <strong>{DENTIST_NAME}</strong> debe confirmar la cita.
                </p>
              </div>

              {/* Summary card */}
              <div className="w-full bg-slatey-50 rounded-2xl p-4 space-y-2 text-sm">
                <Row label="Servicio" value={treatment.name} />
                <Row label="Fecha" value={`${selectedDay} · ${selectedTime}`} />
                <Row label="Odontólogo" value={`Dr. ${DENTIST_NAME}`} />
                <div className="h-px bg-slatey-200" />
                <Row
                  label="Depósito pagado (20%)"
                  value={`S/ ${guarantee.toFixed(2)}`}
                  valueClass="text-success-600 font-bold"
                />
                <Row
                  label="Saldo en clínica"
                  value={`S/ ${balance.toFixed(2)}`}
                />
              </div>

              {/* Action buttons */}
              <Button ref={closeBtnRef} fullWidth size="lg" onClick={onClose}>
                Ver mi cita
              </Button>

              <div className="grid grid-cols-3 gap-2 w-full">
                <ActionBtn icon={<Download className="w-4 h-4" />} label="Comprobante" onClick={handleDownload} />
                <ActionBtn icon={<Calendar className="w-4 h-4" />} label="Calendario" onClick={handleAddToCalendar} />
                <ActionBtn icon={<Share2 className="w-4 h-4" />} label="WhatsApp" onClick={handleWhatsApp} />
              </div>

              <p className="text-[11px] text-slatey-400 leading-snug">
                <CheckCircle2 className="w-3 h-3 inline mr-1 text-success-400" />
                Tus datos están protegidos conforme a la{' '}
                <strong>Ley N.° 29733</strong> de protección de datos personales.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
  valueClass = 'text-slatey-800 font-semibold',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-slatey-500 text-xs">{label}</span>
      <span className={`text-xs ${valueClass} text-right`}>{value}</span>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-slatey-100 hover:bg-slatey-200 transition-colors text-slatey-600"
    >
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

