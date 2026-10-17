import type { Treatment } from './types';
import type { CitaApi } from './api/citas';
import type { AppointmentRequest } from './types';
import type { DayLabel } from './types';

// Types for the constants are imported above for clarity, but note:
// - Treatment is from './types'
// - CitaApi is from './api/citas'
// - AppointmentRequest is from './types'
// - DayLabel is from './types'

export const TREATMENTS: Treatment[] = [
  { id: 'limpieza', name: 'Limpieza Dental Profunda', price: 80, description: 'Profilaxis completa con ultrasonido y pulido', duration: 60 },
  { id: 'consulta', name: 'Consulta General / Diagnóstico', price: 50, description: 'Evaluación clínica y plan de tratamiento', duration: 30 },
  { id: 'urgencia', name: 'Urgencia / Dolor Agudo', price: 60, description: 'Atención inmediata para dolor agudo', duration: 45 },
];

export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export const DENTIST_WORK_SCHEDULE: Record<string, Record<string, { active: boolean; start: string; end: string }>> = {
  '1': {
    'Lun': { active: true, start: '08:00', end: '17:00' },
    'Mar': { active: true, start: '08:00', end: '17:00' },
    'Mié': { active: true, start: '08:00', end: '17:00' },
    'Jue': { active: true, start: '08:00', end: '17:00' },
    'Vie': { active: true, start: '08:00', end: '17:00' },
    'Sáb': { active: true, start: '09:00', end: '14:00' },
    'Dom': { active: false, start: '', end: '' },
  },
  '2': {
    'Lun': { active: true, start: '09:00', end: '18:00' },
    'Mar': { active: true, start: '09:00', end: '18:00' },
    'Mié': { active: true, start: '09:00', end: '18:00' },
    'Jue': { active: true, start: '09:00', end: '18:00' },
    'Vie': { active: true, start: '09:00', end: '18:00' },
    'Sáb': { active: false, start: '', end: '' },
    'Dom': { active: false, start: '', end: '' },
  },
  '3': {
    'Lun': { active: true, start: '10:00', end: '19:00' },
    'Mar': { active: true, start: '10:00', end: '19:00' },
    'Mié': { active: true, start: '10:00', end: '19:00' },
    'Jue': { active: true, start: '10:00', end: '19:00' },
    'Vie': { active: true, start: '10:00', end: '19:00' },
    'Sáb': { active: true, start: '10:00', end: '15:00' },
    'Dom': { active: false, start: '', end: '' },
  },
  '4': {
    'Lun': { active: true, start: '08:00', end: '17:00' },
    'Mar': { active: true, start: '08:00', end: '17:00' },
    'Mié': { active: true, start: '08:00', end: '17:00' },
    'Jue': { active: true, start: '08:00', end: '17:00' },
    'Vie': { active: true, start: '08:00', end: '17:00' },
    'Sáb': { active: true, start: '08:00', end: '13:00' },
    'Dom': { active: false, start: '', end: '' },
  },
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRealId = (id: string) => UUID_RE.test(id);

export function citaToRequest(c: CitaApi): AppointmentRequest | null {
  let status: AppointmentRequest['status'];
  switch (c.estado) {
    case 'PENDIENTE_CONFIRMACION': status = 'PENDING_APPROVAL'; break;
    case 'CONFIRMADA':
    case 'COMPLETADA': status = 'CONFIRMED'; break;
    case 'REPROGRAMADA': status = 'RESCHEDULE_REQUESTED'; break;
    default: return null; // PENDIENTE_PAGO (turno retenido), canceladas e inasistencias no se listan como solicitudes
  }
  const [y, m, d] = c.inicio.slice(0, 10).split('-').map(Number);
  const dayLabel = DAY_LABELS[(new Date(y, m - 1, d).getDay() + 6) % 7] as DayLabel; // getDay(): 0 = domingo
  const minutos = Math.max(15, Math.round((new Date(c.fin).getTime() - new Date(c.inicio).getTime()) / 60000));
  return {
    id: c.id,
    dentistId: c.odontologo.id,
    patientName: c.paciente?.nombre ?? '',
    patientDni: '',
    patientAge: '',
    patientEmail: c.paciente?.correo ?? '',
    patientPhone: c.paciente?.telefono ?? '',
    treatment: { id: c.servicio.id, name: c.servicio.titulo, price: Number(c.precio), description: '', duration: minutos },
    dayLabel,
    selectedDay: `${dayLabel} ${d}`,
    selectedTime: c.inicio.slice(11, 16),
    status,
    createdAt: new Date(c.creadoEn).getTime() || Date.now(),
  };
}