import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, DollarSign, TrendingUp, Users, Clock,
  ArrowRight, Lock, Unlock, AlertTriangle,
  CheckCircle2, XCircle, User as UserIcon, ShieldCheck, RefreshCw,
} from 'lucide-react';
import { useApp } from '@/store';
import { Badge } from '@/components/ui';
import type { AgendaPatient, AppointmentStatus } from '@/types';
import { getPatientsByDay, getPatientById, WEEK_SCHEDULE } from '@/lib/dentistData';

const TREATMENT_PRICES: Record<string, number> = {
  'Limpieza Dental Profunda': 80,
  'Consulta General': 50,
  'Consulta General / Diagnóstico': 50,
  'Urgencia / Dolor Agudo': 60,
};

function calculateDailyIncome(): { day: string; income: number }[] {
  return WEEK_SCHEDULE.map((d) => {
    const income = d.patients
      .filter((p) => p.guaranteePaid)
      .reduce((sum, p) => sum + (TREATMENT_PRICES[p.treatment] ?? 0), 0);
    return { day: d.dayLabel, income };
  });
}

function IncomeBar({ day, income, heightPct, index }: { day: string; income: number; heightPct: number; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex-1 flex flex-col items-center gap-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
    >
      <div className="relative w-full" style={{ height: 120 }}>
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slatey-700 whitespace-nowrap">
          S/ {income.toLocaleString()}
        </span>
        {hovered && (
          <span className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slatey-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap z-10">
            S/ {income.toLocaleString()}
          </span>
        )}
        <div className="w-full h-full flex items-end">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${heightPct}%` }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 120, damping: 20 }}
            className={`w-full rounded-t-lg ${income > 0 ? 'bg-gradient-to-t from-primary-500 to-primary-400' : 'bg-slatey-100'}`}
            style={{ minHeight: income > 0 ? 8 : 2 }}
          />
        </div>
      </div>
      <span className="text-[10px] font-semibold text-slatey-500">{day}</span>
    </div>
  );
}

type DashboardProps = {
  dentistName: string;
  onGoToAgenda: () => void;
  onGoToPatient: (id: string) => void;
};

type MarkResult = 'completed' | 'no_show' | null;

export default function Dashboard({ dentistName, onGoToAgenda, onGoToPatient }: DashboardProps) {
  const { showWelcomeBanner, setShowWelcomeBanner, agendaLocked, setAgendaLocked, appointmentRequests, approveAppointmentRequest, requestAppointmentReschedule } = useApp();
  const [markResult, setMarkResult] = useState<MarkResult>(null);
  const [marking, setMarking] = useState(false);

  const todayPatients = getPatientsByDay(0);

  // Find the next upcoming patient (first CONFIRMED or IN_PROGRESS)
  const nextPatient: AgendaPatient | undefined =
    todayPatients.find((p) => p.status === 'IN_PROGRESS') ||
    todayPatients.find((p) => p.status === 'CONFIRMED');

  const nextPatientRecord = nextPatient ? getPatientById(nextPatient.id) : undefined;

  const todayCount = todayPatients.length;
  const dailyIncome = calculateDailyIncome();
  const maxIncome = Math.max(...dailyIncome.map((d) => d.income), 1);
  const weekTotal = dailyIncome.reduce((s, d) => s + d.income, 0);
  const monthPatients = 48;
  const occupancyRate = 78;
  const monthStrikes = 2;
  const pendingRequests = appointmentRequests.filter((request) => request.status === 'PENDING_APPROVAL');

  const handleMark = (result: 'completed' | 'no_show') => {
    setMarking(true);
    setTimeout(() => {
      setMarking(false);
      setMarkResult(result);
    }, 1000);
  };

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      {showWelcomeBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-5 text-white shadow-lg shadow-primary-500/20"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-4 top-12 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-white" />
              <span className="text-xs font-semibold text-primary-100 uppercase tracking-wide">Sesión activa</span>
            </div>
            <h2 className="text-2xl font-extrabold font-display mb-1">¡Bienvenido/a, Dr/a. {dentistName}!</h2>
            <p className="text-sm text-primary-100 mb-4">Reanudamos tu sesión automáticamente. Esto es lo que tienes hoy:</p>
            <div className="flex gap-4">
              <div className="flex-1 bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-primary-100" />
                  <span className="text-xs text-primary-100">Citas hoy</span>
                </div>
                <p className="text-2xl font-extrabold">{todayCount}</p>
              </div>
              <div className="flex-1 bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-primary-100" />
                  <span className="text-xs text-primary-100">Pacientes</span>
                </div>
                <p className="text-2xl font-extrabold">{monthPatients}</p>
              </div>
            </div>
            <button onClick={() => setShowWelcomeBanner(false)} className="mt-3 text-xs text-primary-100 hover:text-white font-medium">
              Cerrar resumen
            </button>
          </div>
        </motion.div>
      )}

      {/* Lock Agenda Button */}
<motion.button
          id="dentist-lock-agenda-button"
          data-testid="dentist-lock-agenda-button"
         initial={{ opacity: 0, y: 5 }}
         animate={{ opacity: 1, y: 0 }}
         onClick={() => setAgendaLocked(!agendaLocked)}
         className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
           agendaLocked
             ? 'bg-error-500 text-white hover:bg-error-600 shadow-md shadow-error-500/20'
             : 'bg-slatey-800 text-white hover:bg-slatey-900 shadow-md shadow-slatey-900/10'
         }`}
       >
        <AnimatePresence mode="wait">
          {agendaLocked ? (
            <motion.div key="locked" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
              <Unlock className="w-4 h-4" /> Agenda bloqueada - Toca para desbloquear
            </motion.div>
          ) : (
            <motion.div key="unlocked" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> Bloquear agenda hoy
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {pendingRequests.length > 0 && (
        <section id="dentist-pending-requests" data-testid="dentist-pending-requests" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slatey-900">Solicitudes de cita pendientes</h3>
            <Badge variant="warning" size="sm" data-testid="dentist-pending-requests-badge">{pendingRequests.length} nuevas</Badge>
          </div>
          {pendingRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-2xl border border-accent-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slatey-900">{request.patientName}</p>
                  <p className="text-xs text-slatey-500">DNI {request.patientDni} · {request.patientAge} años</p>
                  <p className="text-xs font-semibold text-slatey-700 mt-1">{request.selectedDay} · {request.selectedTime} · {request.treatment.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => approveAppointmentRequest(request.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-success-500 py-2.5 text-xs font-bold text-white hover:bg-success-600"
                >
                  <CheckCircle2 className="w-4 h-4" /> Aprobar
                </button>
                <button
                  onClick={() => requestAppointmentReschedule(request.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-50 py-2.5 text-xs font-bold text-accent-700 hover:bg-accent-100"
                >
                  <RefreshCw className="w-4 h-4" /> Solicitar reprogramación
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* PRÓXIMO PACIENTE — Amplified Featured Card */}
      {nextPatient && nextPatientRecord && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-white border-2 border-primary-200 shadow-lg shadow-primary-500/10"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-white"
              />
              <span className="text-xs font-bold uppercase tracking-wide">Próximo Paciente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-100" />
              <span className="text-sm font-bold">{nextPatient.time} {Number(nextPatient.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}</span>
            </div>
          </div>

          {/* Patient info */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={nextPatient.photo} alt={nextPatient.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-100" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${nextPatient.status === 'IN_PROGRESS' ? 'bg-primary-500' : 'bg-success-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slatey-900 font-display">{nextPatient.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="neutral" size="sm">
                    <UserIcon className="w-3 h-3" /> DNI: {nextPatient.dni}
                  </Badge>
                  <Badge variant="neutral" size="sm">{nextPatient.age} años</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50">
              <Calendar className="w-4 h-4 text-slatey-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-slatey-500">Procedimiento</p>
                <p className="text-sm font-bold text-slatey-900">{nextPatient.treatment}</p>
              </div>
              {nextPatient.guaranteePaid ? (
                <Badge variant="success" size="sm">
                  <ShieldCheck className="w-3 h-3" /> S/ 20.00 Pagado
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  <Clock className="w-3 h-3" /> Pago pendiente
                </Badge>
              )}
            </div>

            {/* Live marking controls */}
            <AnimatePresence mode="wait">
              {markResult === null ? (
                <motion.div key="controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMark('completed')}
                      disabled={marking}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-success-500 text-white font-bold text-sm hover:bg-success-600 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-success-500/20"
                    >
                      {marking ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> Atención Realizada
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleMark('no_show')}
                      disabled={marking}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-error-500 text-white font-bold text-sm hover:bg-error-600 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-error-500/20"
                    >
                      {marking ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" /> Inasistencia
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent-50 border border-accent-100">
                    <Clock className="w-4 h-4 text-accent-600 flex-shrink-0" />
                    <p className="text-[11px] text-accent-700 font-medium">
                      Habilitado a partir de las {nextPatient.time} - 15 min de tolerancia
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <div className={`flex items-center gap-3 p-4 rounded-2xl ${markResult === 'completed' ? 'bg-success-50 border border-success-100' : 'bg-error-50 border border-error-100'}`}>
                    {markResult === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 text-success-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-success-700">Atención registrada</p>
                          <p className="text-xs text-success-600">Se marcó la cita como completada correctamente.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-8 h-8 text-error-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-error-700">Inasistencia registrada</p>
                          <p className="text-xs text-error-600">Se aplicó 1 strike al paciente. Puede apelar con descanso médico.</p>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setMarkResult(null)}
                    className="w-full text-xs text-slatey-500 hover:text-slatey-700 font-semibold py-2"
                  >
                    Deshacer marcación
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => onGoToPatient(nextPatient.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-50 text-primary-600 text-sm font-bold hover:bg-primary-100 transition-colors"
            >
              Ver historia clínica <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* 2x2 Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: DollarSign, label: 'Ingresos de la semana', value: `S/ ${weekTotal.toLocaleString()}`, sub: 'Calculado de citas pagadas', color: 'primary' as const },
          { icon: Users, label: 'Pacientes atendidos', value: String(monthPatients), sub: '48 este mes', color: 'success' as const },
          { icon: TrendingUp, label: 'Tasa de ocupación', value: `${occupancyRate}%`, sub: '+5% vs mes anterior', color: 'accent' as const },
          { icon: AlertTriangle, label: 'Strikes registrados', value: String(monthStrikes), sub: '2 este mes', color: 'error' as const },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-4 border border-slatey-100"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
                stat.color === 'primary' ? 'bg-primary-50' :
                stat.color === 'success' ? 'bg-success-50' :
                stat.color === 'accent' ? 'bg-accent-50' : 'bg-error-50'
              }`}>
                <Icon className={`w-5 h-5 ${
                  stat.color === 'primary' ? 'text-primary-500' :
                  stat.color === 'success' ? 'text-success-500' :
                  stat.color === 'accent' ? 'text-accent-600' : 'text-error-500'
                }`} />
              </div>
              <p className="text-xl font-extrabold text-slatey-900">{stat.value}</p>
              <p className="text-xs font-semibold text-slatey-600 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-slatey-400 mt-0.5">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Ingresos por día — Bar Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-slatey-900">Ingresos por día</h3>
          </div>
          <Badge variant="primary" size="sm">Total: S/ {weekTotal.toLocaleString()}</Badge>
        </div>
        <div className="flex justify-between gap-2">
          {dailyIncome.map((d, i) => {
            const heightPct = maxIncome > 0 ? (d.income / maxIncome) * 100 : 0;
            return (
              <IncomeBar
                key={i}
                day={d.day}
                income={d.income}
                heightPct={heightPct}
                index={i}
              />
            );
          })}
        </div>
      </div>

      {/* Today's Agenda Preview */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slatey-900">Agenda hoy</h3>
          <button onClick={onGoToAgenda} className="flex items-center gap-1 text-xs text-primary-600 font-semibold hover:underline">
            Ver agenda <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2">
          {todayPatients.map((apt, i) => (
            <motion.button
              key={apt.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onGoToPatient(apt.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-slatey-100 hover:border-primary-200 transition-colors text-left"
            >
              <img src={apt.photo} alt={apt.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
        {agendaLocked && (
          <div className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-error-50 border border-error-100 text-error-700">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-semibold">Agenda bloqueada — no se aceptan nuevas reservas</p>
          </div>
        )}
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slatey-400" />
                  <span className="text-xs font-bold text-slatey-900">{apt.time}</span>
                  <span className="text-xs text-slatey-400">·</span>
                  <span className="text-xs text-slatey-500 truncate">{apt.name}</span>
                </div>
                <p className="text-xs text-slatey-400 mt-0.5 truncate">{apt.treatment}</p>
              </div>
              <StatusBadge status={apt.status} />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config: Record<AppointmentStatus, { label: string; variant: 'success' | 'primary' | 'warning' | 'error' | 'neutral' }> = {
    CONFIRMED: { label: 'Confirmada', variant: 'success' },
    PENDING_PAYMENT: { label: 'Pendiente', variant: 'warning' },
    IN_PROGRESS: { label: 'En atención', variant: 'primary' },
    COMPLETED: { label: 'Atendida', variant: 'neutral' },
    NO_SHOW: { label: 'Inasistencia', variant: 'error' },
    CANCELLED: { label: 'Cancelada', variant: 'error' },
  };
  const s = config[status];
  return <Badge variant={s.variant} size="sm">{s.label}</Badge>;
}
