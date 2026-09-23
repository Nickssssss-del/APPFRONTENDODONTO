import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, Clock, MapPin, ShieldCheck, ChevronRight, Plus,
  Stethoscope, CheckCircle2, AlertCircle, RotateCcw, XCircle,
} from 'lucide-react';
import { useApp } from '@/store';
import { Badge, Button } from '@/components/ui';
import type { AppointmentRequestStatus } from '@/types';

type PatientAppointmentStatus = AppointmentRequestStatus | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

type PatientAppointment = {
  id: string;
  dentistId: string;
  dentistName: string;
  specialty: string;
  image: string;
  date: string;
  time: string;
  treatment: string;
  address: string;
  status: PatientAppointmentStatus;
  guaranteePaid: boolean;
  period: 'upcoming' | 'past';
  strikes: number; // 0-3
  late?: boolean; // true if >15 min late
};

const DENTISTS: Record<string, Pick<PatientAppointment, 'dentistName' | 'specialty' | 'image' | 'address'>> = {
  '1': {
    dentistName: 'Dr. Carlos Mendoza',
    specialty: 'Odontólogo General',
    image: 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    address: 'Av. Javier Prado 1234, San Isidro',
  },
  '2': {
    dentistName: 'Dra. Patricia Ruiz',
    specialty: 'Ortodoncista',
    image: 'https://images.pexels.com/photos/6812464/pexels-photo-6812464.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    address: 'Av. Arequipa 2345, Lince',
  },
  '3': {
    dentistName: 'Dr. Miguel Torres',
    specialty: 'Endodoncista',
    image: 'https://images.pexels.com/photos/37458054/pexels-photo-37458054.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    address: 'Av. Brasil 5678, Jesús María',
  },
  '4': {
    dentistName: 'Dra. Lucía Vargas',
    specialty: 'Odontopediatra',
    image: 'https://images.pexels.com/photos/32205053/pexels-photo-32205053.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    address: 'Av. La Marina 3456, San Miguel',
  },
};

const MOCK_APPOINTMENTS: PatientAppointment[] = [
  {
    id: 'patient-upcoming-1',
    dentistId: '1',
    dentistName: DENTISTS['1'].dentistName,
    specialty: DENTISTS['1'].specialty,
    image: DENTISTS['1'].image,
    date: 'Lun 22 Sep',
    time: '09:00',
    treatment: 'Limpieza Dental Profunda',
    address: DENTISTS['1'].address,
    status: 'CONFIRMED',
    guaranteePaid: true,
    period: 'upcoming',
    strikes: 0,
  },
  {
    id: 'patient-upcoming-2',
    dentistId: '2',
    dentistName: DENTISTS['2'].dentistName,
    specialty: DENTISTS['2'].specialty,
    image: DENTISTS['2'].image,
    date: 'Jue 25 Sep',
    time: '11:30',
    treatment: 'Control de ortodoncia',
    address: DENTISTS['2'].address,
    status: 'PENDING_APPROVAL',
    guaranteePaid: false,
    period: 'upcoming',
    strikes: 0,
  },
  {
    id: 'patient-upcoming-3',
    dentistId: '3',
    dentistName: DENTISTS['3'].dentistName,
    specialty: DENTISTS['3'].specialty,
    image: DENTISTS['3'].image,
    date: 'Sáb 27 Sep',
    time: '10:00',
    treatment: 'Consulta General / Diagnóstico',
    address: DENTISTS['3'].address,
    status: 'RESCHEDULE_REQUESTED',
    guaranteePaid: true,
    period: 'upcoming',
    strikes: 1,
    late: true,
  },
  {
    id: 'patient-past-1',
    dentistId: '1',
    dentistName: DENTISTS['1'].dentistName,
    specialty: DENTISTS['1'].specialty,
    image: DENTISTS['1'].image,
    date: 'Lun 15 Sep',
    time: '09:00',
    treatment: 'Limpieza Dental Profunda',
    address: DENTISTS['1'].address,
    status: 'COMPLETED',
    guaranteePaid: true,
    period: 'past',
    strikes: 0,
  },
  {
    id: 'patient-past-2',
    dentistId: '4',
    dentistName: DENTISTS['4'].dentistName,
    specialty: DENTISTS['4'].specialty,
    image: DENTISTS['4'].image,
    date: 'Vie 12 Sep',
    time: '15:30',
    treatment: 'Consulta General / Diagnóstico',
    address: DENTISTS['4'].address,
    status: 'COMPLETED',
    guaranteePaid: true,
    period: 'past',
    strikes: 0,
  },
  {
    id: 'patient-past-3',
    dentistId: '3',
    dentistName: DENTISTS['3'].dentistName,
    specialty: DENTISTS['3'].specialty,
    image: DENTISTS['3'].image,
    date: 'Mié 10 Sep',
    time: '17:00',
    treatment: 'Urgencia / Dolor Agudo',
    address: DENTISTS['3'].address,
    status: 'CANCELLED',
    guaranteePaid: false,
    period: 'past',
    strikes: 2,
  },
];

const statusConfig: Record<PatientAppointmentStatus, { label: string; variant: 'success' | 'warning' | 'accent' | 'neutral' | 'error'; icon: typeof CheckCircle2 }> = {
  CONFIRMED: { label: 'Confirmada', variant: 'success', icon: CheckCircle2 },
  PENDING_APPROVAL: { label: 'Pendiente de aprobación', variant: 'warning', icon: AlertCircle },
  RESCHEDULE_REQUESTED: { label: 'Reprogramación solicitada', variant: 'accent', icon: RotateCcw },
  COMPLETED: { label: 'Atendida', variant: 'neutral', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelada', variant: 'error', icon: AlertCircle },
};

function AppointmentCard({ appointment }: { appointment: PatientAppointment }) {
  const { setSelectedDentistId, setScreen } = useApp();
  const status = statusConfig[appointment.status];
  const StatusIcon = status.icon;

  // Simple 12h rule: allow free cancel/reschedule for upcoming appointments (mock)
  const canModifyFree = appointment.period === 'upcoming' && appointment.status !== 'CANCELLED';

  const strikeDots = Array.from({ length: 3 }, (_, i) => (
    <span
      key={i}
      className={`w-2 h-2 rounded-full border border-slatey-300 ${i < appointment.strikes ? 'bg-error-500 border-error-500' : 'bg-transparent'}`}
    />
  ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-slatey-100 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="relative flex-shrink-0">
          <img src={appointment.image} alt={appointment.dentistName} className="h-12 w-12 rounded-2xl border-2 border-white object-cover shadow-sm" />
          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
            appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED' ? 'bg-success-500' :
            appointment.status === 'PENDING_APPROVAL' ? 'bg-accent-500' :
            appointment.status === 'RESCHEDULE_REQUESTED' ? 'bg-primary-500' : 'bg-error-500'
          }`} />
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
              <StatusIcon className="h-3 w-3" /> {status.label}
            </Badge>
            {appointment.guaranteePaid && (
              <Badge variant="success" size="sm">
                <ShieldCheck className="h-3 w-3" /> Garantía S/ 20
              </Badge>
            )}
            {(appointment.strikes > 0 || appointment.late) && (
              <Badge variant="error" size="sm" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {appointment.late ? 'Tardanza >15m' : 'Inasistencia'}
                <span className="flex gap-0.5 ml-1">{strikeDots}</span>
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
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              setSelectedDentistId(appointment.dentistId);
              setScreen('dentistProfile');
            }}
          >
            Ver odontólogo <ChevronRight className="h-4 w-4" />
          </Button>
          {appointment.period === 'upcoming' && appointment.status !== 'CANCELLED' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setScreen('chatbot')}
            >
              <Stethoscope className="h-4 w-4" /> Ayuda con la cita
            </Button>
          )}
          {canModifyFree && appointment.status !== 'CANCELLED' && (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => alert('Cancelar cita (sin penalización >12h)')}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={() => alert('Reprogramar cita (sin penalización >12h)')}>
                Reprogramar
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PatientAppointments() {
  const { appointmentRequests, setSelectedDentistId, setScreen, user } = useApp();
  const [period, setPeriod] = useState<'upcoming' | 'past'>('upcoming');

  const requestAppointments = useMemo<PatientAppointment[]>(() => appointmentRequests.map((request) => {
    const dentist = DENTISTS[request.dentistId] || DENTISTS['1'];
    return {
      id: request.id,
      dentistId: request.dentistId,
      dentistName: dentist.dentistName,
      specialty: dentist.specialty,
      image: dentist.image,
      date: request.selectedDay,
      time: request.selectedTime,
      treatment: request.treatment.name,
      address: dentist.address,
      status: request.status,
      guaranteePaid: true,
      period: 'upcoming' as const,
    };
  }), [appointmentRequests]);

  const appointments = useMemo(() => [...requestAppointments, ...MOCK_APPOINTMENTS], [requestAppointments]);
  const upcoming = appointments.filter((appointment) => appointment.period === 'upcoming');
  const past = appointments.filter((appointment) => appointment.period === 'past');
  const visibleAppointments = period === 'upcoming' ? upcoming : past;

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

        {visibleAppointments.length === 0 ? (
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
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
