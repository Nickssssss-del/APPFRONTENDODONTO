import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, Clock, MapPin, ShieldCheck, ChevronRight, Plus,
  Stethoscope, CheckCircle2, AlertCircle, RotateCcw, XCircle, Loader2, CreditCard,
} from 'lucide-react';
import { useApp } from '@/storeHooks';
import { Badge, Button, Modal } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { misCitas, cancelarCita, type CitaApi, type EstadoCita } from '@/api/citas';
import { ApiError } from '@/api/http';
import { diaLima, horaLima, soles, segundosHasta, ETIQUETA_ESTADO } from '@/lib/format';

type PatientAppointment = {
  id: string;
  dentistId: string;
  dentistName: string;
  date: string;
  time: string;
  treatment: string;
  address: string;
  status: EstadoCita;
  deposit: number;
  depositPaid: boolean;
  period: 'upcoming' | 'past';
  cancelable: boolean;
  /** PENDIENTE_PAGO con tiempo restante: se puede ir a pagar. */
  payable: boolean;
  raw: CitaApi;
};

const ACTIVAS: EstadoCita[] = ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA'];

/** Cita del backend → fila que ya sabe dibujar la tarjeta. */
function aFila(c: CitaApi): PatientAppointment {
  const activa = ACTIVAS.includes(c.estado);
  const futura = new Date(c.fin).getTime() > Date.now();
  return {
    id: c.id,
    dentistId: c.odontologo.id,
    dentistName: c.odontologo.nombre,
    date: diaLima(c.inicio),
    time: horaLima(c.inicio),
    treatment: c.servicio.titulo,
    address: [c.odontologo.direccion ?? c.odontologo.consultorio, c.odontologo.distrito].filter(Boolean).join(', '),
    status: c.estado,
    deposit: c.depositoRequerido,
    depositPaid: c.estado !== 'PENDIENTE_PAGO' && !c.estado.startsWith('CANCELADA'),
    period: activa && futura ? 'upcoming' : 'past',
    cancelable: activa && futura,
    payable: c.estado === 'PENDIENTE_PAGO' && segundosHasta(c.pagarAntesDe) > 0,
    raw: c,
  };
}

type Variante = 'success' | 'warning' | 'accent' | 'neutral' | 'error';
const statusConfig: Record<EstadoCita, { variant: Variante; icon: typeof CheckCircle2; dot: string }> = {
  PENDIENTE_PAGO: { variant: 'warning', icon: CreditCard, dot: 'bg-accent-500' },
  PENDIENTE_CONFIRMACION: { variant: 'warning', icon: AlertCircle, dot: 'bg-accent-500' },
  CONFIRMADA: { variant: 'success', icon: CheckCircle2, dot: 'bg-success-500' },
  COMPLETADA: { variant: 'neutral', icon: CheckCircle2, dot: 'bg-success-500' },
  CANCELADA_CON_REEMBOLSO: { variant: 'error', icon: AlertCircle, dot: 'bg-error-500' },
  CANCELADA_SIN_REEMBOLSO: { variant: 'error', icon: AlertCircle, dot: 'bg-error-500' },
  INASISTENCIA_PENALIZADA: { variant: 'error', icon: XCircle, dot: 'bg-error-500' },
  REPROGRAMADA: { variant: 'accent', icon: RotateCcw, dot: 'bg-primary-500' },
};

function AppointmentCard({ appointment, onCancel, onPay }: { appointment: PatientAppointment; onCancel: (a: PatientAppointment) => void; onPay: (a: PatientAppointment) => void }) {
  const { setSelectedDentistId, setSelectedDentistName, setScreen } = useApp();
  const status = statusConfig[appointment.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-slatey-100 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="relative flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white bg-primary-100 text-sm font-bold text-primary-700 shadow-sm" aria-hidden="true">
            {appointment.dentistName.replace(/^(Dr\.|Dra\.)\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'OD'}
          </div>
          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${status.dot}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slatey-500">
            <Clock className="h-3.5 w-3.5 text-primary-500" />
            <span>{appointment.time}</span>
            <span className="text-slatey-300">·</span>
            <span className="truncate">{appointment.date}</span>
          </div>
          <h3 className="mt-0.5 truncate text-sm font-bold text-slatey-900">{appointment.dentistName}</h3>
          <p className="mt-0.5 truncate text-xs text-slatey-500">{appointment.treatment}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant={status.variant} size="sm">
              <StatusIcon className="h-3 w-3" /> {ETIQUETA_ESTADO[appointment.status]}
            </Badge>
            {appointment.depositPaid && (
              <Badge variant="success" size="sm">
                <ShieldCheck className="h-3 w-3" /> Depósito {soles(appointment.deposit)}
              </Badge>
            )}
            {appointment.status === 'INASISTENCIA_PENALIZADA' && (
              <Badge variant="error" size="sm" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Inasistencia
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-slatey-100 px-4 pb-4 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slatey-500">
          <MapPin className="h-3.5 w-3.5 text-slatey-400" />
          <span className="truncate">{appointment.address}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold px-2 py-2.5 rounded-xl"
            onClick={() => {
              setSelectedDentistId(appointment.dentistId);
              setSelectedDentistName(appointment.dentistName);
              setScreen('marketplace');
            }}
          >
            Ver odontólogo <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          {appointment.period === 'upcoming' && (
            <Button
              size="sm"
              className="w-full text-xs font-semibold px-2 py-2.5 rounded-xl"
              onClick={() => setScreen('chatbot')}
            >
              <Stethoscope className="h-3.5 w-3.5" /> Ayuda con la cita
            </Button>
          )}
          {appointment.payable && (
            <Button size="sm" className="col-span-2 w-full text-xs font-semibold px-2 py-2.5 rounded-xl" onClick={() => onPay(appointment)}>
              <CreditCard className="h-3.5 w-3.5" /> Pagar depósito
            </Button>
          )}
          {appointment.cancelable && (
            <Button variant="outline" size="sm" className="col-span-2 w-full text-xs font-semibold px-2 py-2.5 rounded-xl" onClick={() => onCancel(appointment)}>
              Cancelar cita
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PatientAppointments() {
  const {
    setSelectedDentistId, setScreen, user, setActiveCita, setSelectedTreatment, setSelectedDay, setSelectedTime,
    setSelectedDentistName,
  } = useApp();
  const [period, setPeriod] = useState<'upcoming' | 'past'>('upcoming');
  const citas = useAsync(() => misCitas(), []);
  const appointments = useMemo(() => (citas.data ?? []).map(aFila), [citas.data]);
  const upcoming = appointments.filter((a) => a.period === 'upcoming');
  const past = appointments.filter((a) => a.period === 'past');
  const visibleAppointments = period === 'upcoming' ? upcoming : past;

  // Cancelación con motivo opcional
  const [aCancelar, setACancelar] = useState<PatientAppointment | null>(null);
  const [motivo, setMotivo] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState<string | null>(null);

  const confirmarCancelacion = async () => {
    if (!aCancelar || cancelando) return;
    setCancelando(true);
    setErrorCancelar(null);
    try {
      await cancelarCita(aCancelar.id, motivo.trim() || undefined);
      setACancelar(null);
      setMotivo('');
      citas.reload();
    } catch (e) {
      setErrorCancelar(e instanceof ApiError ? e.message : 'No se pudo cancelar la cita.');
    } finally {
      setCancelando(false);
    }
  };

  // Retoma el pago de una cita PENDIENTE_PAGO que aún está dentro de los 15 minutos
  const irAPagar = (a: PatientAppointment) => {
    const c = a.raw;
    setActiveCita(c);
    setSelectedDentistName(c.odontologo.nombre);
    setSelectedTreatment({
      id: c.servicio.id,
      name: c.servicio.titulo,
      price: c.precio,
      description: '',
      duration: Math.max(1, Math.round((new Date(c.fin).getTime() - new Date(c.inicio).getTime()) / 60000)),
      deposit: c.depositoRequerido,
    });
    setSelectedDay(diaLima(c.inicio));
    setSelectedTime(horaLima(c.inicio));
    setScreen('checkout');
  };

  return (
    <div className="min-h-screen bg-slatey-50 pb-24">
      <div className="sticky top-0 z-30 border-b border-slatey-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-slatey-900 font-display">Mis citas</h2>
            <p className="text-xs text-slatey-500">{user.fullName || 'Paciente'} · Próximas y pasadas</p>
          </div>
          <button
            onClick={() => {
              setSelectedDentistId(null);
              setScreen('marketplace');
            }}
            className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" /> Nueva
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-4">
            <div className="flex items-center gap-2 text-primary-600">
              <CalendarDays className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wide">Próximas</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slatey-900">{upcoming.length}</p>
            <p className="text-xs text-slatey-500">reservas en calendario</p>
          </div>
          <div className="rounded-2xl border border-slatey-100 bg-white p-4">
            <div className="flex items-center gap-2 text-slatey-500">
              <RotateCcw className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wide">Historial</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slatey-900">{past.length}</p>
            <p className="text-xs text-slatey-500">atenciones registradas</p>
          </div>
        </div>

        <div className="flex rounded-2xl bg-slatey-100 p-1">
          {(['upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPeriod(tab)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                period === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-slatey-500 hover:text-slatey-700'
              }`}
            >
              {tab === 'upcoming' ? 'Próximas' : 'Pasadas'}
            </button>
          ))}
        </div>

        {citas.loading ? (
          <div className="flex justify-center py-12" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-label="Cargando citas" />
          </div>
        ) : citas.error ? (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-slatey-100 bg-white p-8 text-center">
            <AlertCircle className="h-7 w-7 text-accent-600" />
            <p className="text-sm text-slatey-600">{citas.error}</p>
            <Button size="sm" onClick={citas.reload}>Reintentar</Button>
          </div>
        ) : visibleAppointments.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slatey-200 bg-white py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
              <CalendarDays className="h-7 w-7 text-primary-500" />
            </div>
            <h3 className="text-sm font-bold text-slatey-900">No hay citas {period === 'upcoming' ? 'próximas' : 'pasadas'}</h3>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slatey-500">
              {period === 'upcoming' ? 'Reserva una consulta con uno de nuestros odontólogos verificados.' : 'Cuando tengas atenciones, aparecerán en tu historial.'}
            </p>
            {period === 'upcoming' && (
              <Button className="mt-4" onClick={() => setScreen('marketplace')}>
                Buscar odontólogo <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} onCancel={setACancelar} onPay={irAPagar} />
            ))}
          </div>
        )}
      </div>

      <Modal open={!!aCancelar} onClose={() => !cancelando && setACancelar(null)} title="Cancelar cita">
        <div className="space-y-4">
          <p className="text-sm text-slatey-600">
            {aCancelar ? `${aCancelar.treatment} · ${aCancelar.date}, ${aCancelar.time}` : ''}. El reembolso del depósito depende de la política de cancelación.
          </p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Motivo (opcional)"
            className="w-full rounded-2xl border border-slatey-200 bg-slatey-50 px-3 py-2.5 text-sm text-slatey-900 placeholder:text-slatey-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          {errorCancelar && <p role="alert" className="text-xs font-semibold text-error-600">{errorCancelar}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setACancelar(null)} disabled={cancelando}>Mantener</Button>
            <Button loading={cancelando} onClick={confirmarCancelacion}>Sí, cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
