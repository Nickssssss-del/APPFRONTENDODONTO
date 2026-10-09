import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Clock, Shield, Star } from 'lucide-react';
import { DENTIST_AVATAR, DENTIST_NAME } from '../../lib/dentistData';
import { formatTime } from '../../store';
import type { Treatment } from '../../types';

interface Props {
  treatment: Treatment;
  selectedDay: string;
  selectedTime: string;
  holdSeconds: number;
  isHoldActive: boolean;
  guarantee: number;
  balance: number;
}

export function AppointmentSummary({
  treatment,
  selectedDay,
  selectedTime,
  holdSeconds,
  isHoldActive,
  guarantee,
  balance,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-slatey-100 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        {/* Dentist avatar with COP badge */}
        <div className="relative flex-shrink-0">
          <img
            src={DENTIST_AVATAR}
            alt={`Dr. ${DENTIST_NAME}`}
            className="w-12 h-12 rounded-2xl object-cover"
          />
          <span className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-[9px] font-bold px-1 rounded-full leading-4">
            COP
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slatey-900 truncate">
            Dr. {DENTIST_NAME}
          </p>
          <p className="text-xs text-slatey-500 truncate">{treatment.name}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isHoldActive && (
            <CountdownPill holdSeconds={holdSeconds} />
          )}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-slatey-400" />
          </motion.div>
        </div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-slatey-100 pt-3">
              {/* Date / time row */}
              <div className="flex gap-3">
                <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-slatey-50">
                  <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slatey-700">{selectedDay}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-slatey-50">
                  <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slatey-700">{selectedTime}</span>
                </div>
              </div>

              {/* Rating placeholder */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= 4 ? 'text-accent-400 fill-accent-400' : 'text-slatey-200'}`}
                  />
                ))}
                <span className="text-xs text-slatey-500 ml-1">4.9 · 87 reseñas</span>
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slatey-500">Precio del servicio</span>
                  <span className="font-semibold text-slatey-800">
                    S/ {treatment.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slatey-500 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-success-500" />
                    Depósito de garantía (20%)
                  </span>
                  <span className="font-bold text-success-600">S/ {guarantee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slatey-400">Saldo a pagar en clínica</span>
                  <span className="font-semibold text-slatey-700">S/ {balance.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slatey-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slatey-900">A pagar ahora</span>
                  <span className="text-lg font-extrabold text-primary-600">
                    S/ {guarantee.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CountdownPill({ holdSeconds }: { holdSeconds: number }) {
  const pct = (holdSeconds / 600) * 100.53;
  const urgent = holdSeconds < 120;
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${
        urgent ? 'bg-error-50 text-error-600' : 'bg-accent-50 text-accent-700'
      }`}
    >
      <svg className="w-4 h-4 -rotate-90 flex-shrink-0" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${pct} 100.53`}
          strokeLinecap="round"
        />
      </svg>
      {formatTime(holdSeconds)}
    </div>
  );
}

