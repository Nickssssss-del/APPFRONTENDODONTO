import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, MessageCircle, ChevronRight, Calendar,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import type { AgendaPatient, AppointmentStatus, PatientViewMode } from '@/types';
import { WEEK_SCHEDULE } from '@/lib/dentistData';

const statusConfig: Record<AppointmentStatus, { label: string; variant: 'success' | 'primary' | 'warning' | 'error' | 'neutral' }> = {
  CONFIRMED: { label: 'Confirmada', variant: 'success' },
  PENDING_PAYMENT: { label: 'Pendiente', variant: 'warning' },
  IN_PROGRESS: { label: 'En atención', variant: 'primary' },
  COMPLETED: { label: 'Atendida', variant: 'neutral' },
  NO_SHOW: { label: 'Inasistencia', variant: 'error' },
  CANCELLED: { label: 'Cancelada', variant: 'error' },
};

type PatientsProps = {
  onGoToPatient: (id: string) => void;
};

export default function Patients({ onGoToPatient }: PatientsProps) {
  const [viewMode, setViewMode] = useState<PatientViewMode>('day');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const dayPatients = WEEK_SCHEDULE[selectedDayIdx]?.patients ?? [];

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="bg-slatey-100 rounded-2xl p-1.5 flex gap-1">
        {([
          { id: 'day' as const, label: 'Por Día' },
          { id: 'week' as const, label: 'Por Semana' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
          >
            {viewMode === tab.id && (
              <motion.div
                layoutId="patientsTabBg"
                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${viewMode === tab.id ? 'text-primary-600' : 'text-slatey-500'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Day selector for day view */}
      {viewMode === 'day' && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {WEEK_SCHEDULE.map((d, i) => {
            const active = selectedDayIdx === i;
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIdx(i)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border-2 transition-all min-w-[56px] ${
                  active ? 'border-primary-500 bg-primary-500 text-white' : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'
                }`}
              >
                <span className="text-[10px] font-semibold">{d.dayLabel}</span>
                <span className="text-sm font-extrabold">{d.dateNumber}</span>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'day' ? (
          <motion.div key="day" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <div className="flex items-center justify-between px-1 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slatey-900">{WEEK_SCHEDULE[selectedDayIdx].fullDate}</h3>
                <p className="text-xs text-slatey-500">{dayPatients.length} {dayPatients.length === 1 ? 'paciente' : 'pacientes'}</p>
              </div>
              <Badge variant="primary" size="sm">
                <Users className="w-3 h-3" /> {dayPatients.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {dayPatients.length > 0 ? (
                dayPatients.map((p, i) => (
                  <PatientRow key={p.id} patient={p} index={i} onClick={() => onGoToPatient(p.id)} />
                ))
              ) : (
                <div className="text-center py-8 text-sm text-slatey-400">Sin pacientes programados</div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="week" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <div className="flex items-center justify-between px-1 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slatey-900">Semana del 15 al 21 Sep</h3>
                <p className="text-xs text-slatey-500">Carga de pacientes proyectada</p>
              </div>
              <Badge variant="primary" size="sm">
                <Calendar className="w-3 h-3" /> {WEEK_SCHEDULE.reduce((s, d) => s + d.patients.length, 0)} total
              </Badge>
            </div>
            <div className="space-y-3">
              {WEEK_SCHEDULE.map((dayData, di) => (
                <div key={dayData.dayLabel} className="bg-white rounded-2xl border border-slatey-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slatey-50 border-b border-slatey-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slatey-900">{dayData.fullDate}</span>
                    </div>
                    <Badge variant={dayData.patients.length > 0 ? 'primary' : 'neutral'} size="sm">
                      {dayData.patients.length} {dayData.patients.length === 1 ? 'paciente' : 'pacientes'}
                    </Badge>
                  </div>
                  {dayData.patients.length > 0 ? (
                    <div className="p-2 space-y-1.5">
                      {dayData.patients.map((p, pi) => (
                        <PatientRow key={p.id} patient={p} index={pi} onClick={() => onGoToPatient(p.id)} compact />
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-xs text-slatey-400 text-center">Sin pacientes programados</div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PatientRow({ patient, index, onClick, compact = false }: { patient: AgendaPatient; index: number; onClick: () => void; compact?: boolean }) {
  const status = statusConfig[patient.status];
  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 ${compact ? 'p-2.5' : 'p-3'} rounded-xl bg-white border border-slatey-100 hover:border-primary-200 transition-colors text-left`}
    >
      <img src={patient.photo} alt={patient.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slatey-900 truncate">{patient.name}</span>
          {!compact && <span className="text-xs text-slatey-400 flex-shrink-0">· {patient.dni}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {!compact && <span className="text-xs font-semibold text-slatey-600">{patient.time}</span>}
          {!compact && <span className="text-xs text-slatey-400">·</span>}
          <span className="text-xs text-slatey-500 truncate">{patient.treatment}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <a
          href={`tel:${patient.phone.replace(/\s/g, '')}`}
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center hover:bg-success-200 transition-colors"
        >
          <Phone className="w-4 h-4 text-success-600" />
        </a>
        <a
          href={`https://wa.me/51${patient.whatsapp}`}
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center hover:bg-success-200 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-success-600" />
        </a>
        <Badge variant={status.variant} size="sm">{status.label}</Badge>
        <ChevronRight className="w-4 h-4 text-slatey-300" />
      </div>
    </motion.button>
  );
}
