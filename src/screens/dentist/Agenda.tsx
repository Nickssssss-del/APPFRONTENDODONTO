import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  ShieldCheck, ArrowRight, Phone, Mail, MessageCircle, User,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { AgendaPatient, AppointmentStatus } from '@/types';

const DATES = [
  { day: 'Lun', date: '15', full: 'Lunes 15 Sep' },
  { day: 'Mar', date: '16', full: 'Martes 16 Sep' },
  { day: 'Mié', date: '17', full: 'Miércoles 17 Sep' },
  { day: 'Jue', date: '18', full: 'Jueves 18 Sep' },
  { day: 'Vie', date: '19', full: 'Viernes 19 Sep' },
  { day: 'Sáb', date: '20', full: 'Sábado 20 Sep' },
];

const AGENDA_DATA: AgendaPatient[] = [
  { id: '1', name: 'Juan Pérez Rojas', dni: '87654321', age: '35', time: '10:00', treatment: 'Limpieza Dental Profunda', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '999 888 777', email: 'juan.perez@gmail.com', whatsapp: '999888777' },
  { id: '2', name: 'Ana Torres Quispe', dni: '23456789', age: '42', time: '11:00', treatment: 'Consulta General', status: 'CONFIRMED', guaranteePaid: true, photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '998 777 666', email: 'ana.torres@gmail.com', whatsapp: '998777666' },
  { id: '3', name: 'Luis Ramírez Soto', dni: '34567890', age: '31', time: '14:00', treatment: 'Urgencia / Dolor Agudo', status: 'IN_PROGRESS', guaranteePaid: true, photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '997 666 555', email: 'luis.ramirez@gmail.com', whatsapp: '997666555' },
  { id: '4', name: 'Carmen Díaz Vargas', dni: '45678901', age: '26', time: '15:00', treatment: 'Limpieza Dental Profunda', status: 'PENDING_PAYMENT', guaranteePaid: false, photo: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&h=120&w=120', phone: '996 555 444', email: 'carmen.diaz@gmail.com', whatsapp: '996555444' },
];

const statusConfig: Record<AppointmentStatus, { label: string; variant: 'success' | 'primary' | 'warning' | 'error' | 'neutral'; dot: string }> = {
  CONFIRMED: { label: 'Confirmada', variant: 'success', dot: 'bg-success-500' },
  PENDING_PAYMENT: { label: 'Pendiente', variant: 'warning', dot: 'bg-accent-500' },
  IN_PROGRESS: { label: 'En atención', variant: 'primary', dot: 'bg-primary-500' },
  COMPLETED: { label: 'Atendida', variant: 'neutral', dot: 'bg-slatey-400' },
  NO_SHOW: { label: 'Inasistencia', variant: 'error', dot: 'bg-error-500' },
  CANCELLED: { label: 'Cancelada', variant: 'error', dot: 'bg-error-500' },
};

type AgendaProps = {
  onGoToPatient: (id: string) => void;
};

export default function Agenda({ onGoToPatient }: AgendaProps) {
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Date Carousel */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
        {DATES.map((d, i) => {
          const active = selectedDateIdx === i;
          return (
            <button
              key={i}
              onClick={() => setSelectedDateIdx(i)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl border-2 transition-all min-w-[64px] ${
                active ? 'border-primary-500 bg-primary-500 text-white' : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'
              }`}
            >
              <span className="text-xs font-semibold">{d.day}</span>
              <span className="text-lg font-extrabold">{d.date}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slatey-900">{DATES[selectedDateIdx].full}</h3>
        <Badge variant="primary" size="sm">{AGENDA_DATA.length} citas</Badge>
      </div>

      {/* Appointment Cards */}
      <div className="space-y-3">
        {AGENDA_DATA.map((patient, i) => {
          const isExpanded = expandedId === patient.id;
          const status = statusConfig[patient.status];
          return (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-white rounded-2xl border transition-all ${
                isExpanded ? 'border-primary-300 shadow-md shadow-primary-500/5' : 'border-slatey-100'
              }`}
            >
              {/* Card Header */}
              <button onClick={() => toggleExpand(patient.id)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="relative flex-shrink-0">
                  <img src={patient.photo} alt={patient.name} className="w-12 h-12 rounded-2xl object-cover" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${status.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slatey-400" />
                    <span className="text-sm font-bold text-slatey-900">{patient.time}</span>
                    <span className="text-xs text-slatey-400">·</span>
                    <span className="text-xs text-slatey-500 truncate">{patient.treatment}</span>
                  </div>
                  <p className="text-sm font-semibold text-slatey-900 mt-0.5">{patient.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant={status.variant} size="sm">{status.label}</Badge>
                    {patient.guaranteePaid && (
                      <Badge variant="success" size="sm">
                        <ShieldCheck className="w-3 h-3" /> S/ 20
                      </Badge>
                    )}
                  </div>
                </div>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-slatey-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </motion.div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-slatey-100"
                  >
                    <div className="p-4 space-y-3">
                      {/* Patient Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slatey-50">
                          <p className="text-xs text-slatey-500 mb-0.5 flex items-center gap-1"><User className="w-3 h-3" /> DNI</p>
                          <p className="text-sm font-bold text-slatey-900">{patient.dni}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slatey-50">
                          <p className="text-xs text-slatey-500 mb-0.5 flex items-center gap-1"><User className="w-3 h-3" /> Edad</p>
                          <p className="text-sm font-bold text-slatey-900">{patient.age} años</p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50">
                          <Phone className="w-4 h-4 text-slatey-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-slatey-900">{patient.phone}</span>
                          <div className="ml-auto flex items-center gap-2">
                            <a href={`tel:${patient.phone.replace(/\s/g, '')}`} className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center hover:bg-success-200 transition-colors">
                              <Phone className="w-4 h-4 text-success-600" />
                            </a>
                            <a href={`https://wa.me/51${patient.whatsapp}`} className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center hover:bg-success-200 transition-colors">
                              <MessageCircle className="w-4 h-4 text-success-600" />
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50">
                          <Mail className="w-4 h-4 text-slatey-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-slatey-900 truncate">{patient.email}</span>
                        </div>
                      </div>

                      {patient.status === 'PENDING_PAYMENT' && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-50 border border-accent-200">
                          <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-accent-700">
                            El paciente aún no ha completado el pago de la garantía. La cita se confirmará al recibir el comprobante.
                          </p>
                        </div>
                      )}

                      <Button fullWidth onClick={() => onGoToPatient(patient.id)}>
                        Ver historia clínica <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
