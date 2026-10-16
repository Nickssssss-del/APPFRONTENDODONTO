import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, ChevronRight, AlertTriangle,
  CheckCircle2, RotateCcw, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import SmartImage from '@/components/SmartImage';
import type { PatientAppointmentRow } from './types';

interface Props {
  appointments: PatientAppointmentRow[];
  strikes: number;
  onReserve: () => void;
  onViewDentist: (id: string) => void;
}

const STATUS_MAP = {
  'upcoming-confirmed':  { label: 'Confirmada',          variant: 'success'  as const, icon: CheckCircle2 },
  'upcoming-pending':    { label: 'Pendiente aprobación', variant: 'warning'  as const, icon: AlertCircle  },
  'upcoming-reschedule': { label: 'Reprogramación',       variant: 'accent'   as const, icon: RotateCcw    },
  'completed':           { label: 'Atendida',             variant: 'neutral'  as const, icon: CheckCircle2 },
  'cancelled':           { label: 'Cancelada',            variant: 'error'    as const, icon: AlertCircle  },
};

export function ResumenTab({ appointments, strikes, onReserve, onViewDentist }: Props) {
  const upcoming = appointments.filter((a) => a.period === 'upcoming');
  const past     = appointments.filter((a) => a.period === 'past');
  const next     = upcoming[0] ?? null;
  const attended = past.filter((a) => a.status === 'completed').length;

  return (
    <div
      id="panel-resumen"
      role="tabpanel"
      aria-labelledby="tab-resumen"
      className="space-y-4 p-4"
    >
      {/* ── Metrics row ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          value={attended}
          label="Atendidas"
          color="text-success-600"
          bg="bg-success-50"
        />
        <MetricCard
          value={upcoming.length}
          label="Próximas"
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StrikeCard strikes={strikes} />
      </div>

      {/* ── Next appointment ──────────────────────────────────── */}
      {next ? (
        <NextAppointmentCard
          appointment={next}
          onViewDentist={() => onViewDentist(next.dentistId)}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-slatey-200 bg-white text-center px-4">
          <Calendar className="w-10 h-10 text-slatey-300" />
          <p className="text-sm text-slatey-500">No tienes citas próximas</p>
          <Button size="sm" onClick={onReserve}>
            Reservar cita <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* ── Past appointments preview ─────────────────────────── */}
      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slatey-500 uppercase tracking-wide px-0.5">
            Últimas citas
          </h3>
          {past.slice(0, 3).map((a) => {
            const st = STATUS_MAP[a.status];
            const Icon = st.icon;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slatey-100"
              >
                <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0">
                  <SmartImage
                    src={a.dentistImage}
                    alt={a.dentistName}
                    ratio="1/1"
                    fallback="avatar"
                    gravity="face"
                    fit="cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slatey-800 truncate">{a.dentistName}</p>
                  <p className="text-[11px] text-slatey-500 truncate">{a.treatment}</p>
                  <p className="text-[11px] text-slatey-400">{a.date}</p>
                </div>
                <Badge variant={st.variant} size="sm">
                  <Icon className="w-3 h-3" /> {st.label}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function MetricCard({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-3 text-center`}>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[11px] text-slatey-500 font-semibold leading-tight mt-0.5">{label}</p>
    </div>
  );
}

function StrikeCard({ strikes }: { strikes: number }) {
  const max = 3;
  const color = strikes === 0 ? 'text-success-600' : strikes < 3 ? 'text-accent-600' : 'text-error-600';
  const bg    = strikes === 0 ? 'bg-success-50'  : strikes < 3 ? 'bg-accent-50'   : 'bg-error-50';
  return (
    <div className={`${bg} rounded-2xl p-3 text-center`}>
      <div className="flex justify-center gap-1 mb-1">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full border ${
              i < strikes ? 'bg-error-500 border-error-500' : 'border-slatey-300'
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-bold ${color} leading-tight`}>
        {strikes === 0 ? 'Sin strikes' : `${strikes}/${max} strikes`}
      </p>
      {strikes > 0 && (
        <a
          href="#"
          className="text-[10px] text-primary-600 underline mt-0.5 inline-block"
          onClick={(e) => { e.preventDefault(); alert('Formulario de apelación (integración pendiente)'); }}
        >
          Apelar
        </a>
      )}
    </div>
  );
}

function NextAppointmentCard({ appointment: a, onViewDentist }: { appointment: PatientAppointmentRow; onViewDentist: () => void }) {
  const [cancelled, setCancelled] = useState(false);
  if (cancelled) return null;

  return (
    <div className="bg-white rounded-2xl border border-slatey-100 overflow-hidden shadow-sm">
      <div className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 border-b border-primary-100">
        <Calendar className="w-3.5 h-3.5 text-primary-500" />
        <span className="text-xs font-bold text-primary-700">Próxima cita</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
            <SmartImage
              src={a.dentistImage}
              alt={a.dentistName}
              ratio="1/1"
              fallback="avatar"
              gravity="face"
              fit="cover"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slatey-900 truncate">{a.dentistName}</p>
            <p className="text-xs text-slatey-500 truncate">{a.treatment}</p>
          </div>
          {a.guaranteePaid && (
            <span className="flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-success-500" />
            </span>
          )}
        </div>

        <div className="flex gap-3 text-xs text-slatey-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary-400" /> {a.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary-400" /> {a.time}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slatey-500">
          <MapPin className="w-3.5 h-3.5 text-slatey-400 flex-shrink-0" />
          <span className="truncate">{a.address}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="col-span-1 text-xs"
            onClick={() => {
              if (confirm('¿Cancelar esta cita? Perderás el depósito si faltan menos de 24 h.')) {
                setCancelled(true);
              }
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-error-500" />
            Cancelar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-1 text-xs"
            onClick={() => alert('Reprogramar (integración pendiente)')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reprogramar
          </Button>
          <Button
            size="sm"
            className="col-span-1 text-xs"
            onClick={onViewDentist}
          >
            Ver perfil <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

