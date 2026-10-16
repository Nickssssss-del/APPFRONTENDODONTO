import type { PatientAppointmentRow, ReceiptRow } from './types';
import type { ClinicalEntry } from '@/types';

/** ─── Dentist reference data (mirrors PatientAppointments.tsx) ─── */
const DENTISTS: Record<string, { name: string; specialty: string; image: string; address: string }> = {
  '1': {
    name: 'Dr. Carlos Mendoza',
    specialty: 'Odontólogo General',
    image: 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    address: 'Av. Javier Prado 1234, San Isidro',
  },
  '2': {
    name: 'Dra. Patricia Ruiz',
    specialty: 'Ortodoncista',
    image: 'https://images.pexels.com/photos/6812464/pexels-photo-6812464.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    address: 'Av. Arequipa 2345, Lince',
  },
  '3': {
    name: 'Dr. Miguel Torres',
    specialty: 'Endodoncista',
    image: 'https://images.pexels.com/photos/37458054/pexels-photo-37458054.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    address: 'Av. Brasil 5678, Jesús María',
  },
};

/** ─── Mock appointments ─── */
export const MOCK_APPOINTMENTS: PatientAppointmentRow[] = [
  {
    id: 'up-1',
    dentistId: '1',
    dentistName: DENTISTS['1'].name,
    dentistImage: DENTISTS['1'].image,
    specialty: DENTISTS['1'].specialty,
    address: DENTISTS['1'].address,
    date: 'Lun 22 Sep',
    time: '09:00',
    treatment: 'Limpieza Dental Profunda',
    status: 'upcoming-confirmed',
    guaranteePaid: true,
    guaranteeAmount: 16,
    period: 'upcoming',
    strikes: 0,
  },
  {
    id: 'up-2',
    dentistId: '2',
    dentistName: DENTISTS['2'].name,
    dentistImage: DENTISTS['2'].image,
    specialty: DENTISTS['2'].specialty,
    address: DENTISTS['2'].address,
    date: 'Jue 25 Sep',
    time: '11:30',
    treatment: 'Control de ortodoncia',
    status: 'upcoming-pending',
    guaranteePaid: false,
    guaranteeAmount: 10,
    period: 'upcoming',
    strikes: 0,
  },
  {
    id: 'past-1',
    dentistId: '1',
    dentistName: DENTISTS['1'].name,
    dentistImage: DENTISTS['1'].image,
    specialty: DENTISTS['1'].specialty,
    address: DENTISTS['1'].address,
    date: 'Lun 15 Sep',
    time: '09:00',
    treatment: 'Limpieza Dental Profunda',
    status: 'completed',
    guaranteePaid: true,
    guaranteeAmount: 16,
    period: 'past',
    strikes: 0,
  },
  {
    id: 'past-2',
    dentistId: '3',
    dentistName: DENTISTS['3'].name,
    dentistImage: DENTISTS['3'].image,
    specialty: DENTISTS['3'].specialty,
    address: DENTISTS['3'].address,
    date: 'Mié 10 Sep',
    time: '17:00',
    treatment: 'Urgencia / Dolor Agudo',
    status: 'cancelled',
    guaranteePaid: false,
    guaranteeAmount: 12,
    period: 'past',
    strikes: 2,
  },
];

/** ─── Mock clinical history (NEVER stored in localStorage) ─── */
export const MOCK_HISTORY: ClinicalEntry[] = [
  {
    id: 'h-1',
    date: '15 Sep 2026',
    time: '09:00',
    type: 'evolution',
    title: 'Evolución clínica – Limpieza',
    description: 'Se realizó profilaxis con ultrasonido y pulido coronario. Paciente refiere leve sensibilidad. Se recomienda pasta desensibilizante por 15 días.',
    attachments: [],
  },
  {
    id: 'h-2',
    date: '15 Sep 2026',
    time: '09:30',
    type: 'odontogram',
    title: 'Odontograma inicial',
    description: 'Registro de piezas dentales. Caries en 16 (oclusal) y 26 (mesial). Resto en buen estado.',
    attachments: [
      'https://images.pexels.com/photos/6502543/pexels-photo-6502543.jpeg?auto=compress&cs=tinysrgb&h=600&w=600',
    ],
  },
  {
    id: 'h-3',
    date: '10 Sep 2026',
    time: '14:00',
    type: 'xray',
    title: 'Radiografía panorámica',
    description: 'Placa solicitada para evaluación de terceras molares. Impactación en pieza 38 y 48.',
    attachments: [
      'https://images.pexels.com/photos/6501868/pexels-photo-6501868.jpeg?auto=compress&cs=tinysrgb&h=800&w=800',
      'https://images.pexels.com/photos/6501862/pexels-photo-6501862.jpeg?auto=compress&cs=tinysrgb&h=800&w=800',
    ],
  },
  {
    id: 'h-4',
    date: '10 Sep 2026',
    time: '14:45',
    type: 'prescription',
    title: 'Receta médica',
    description: 'Ibuprofeno 600 mg c/8h por 5 días. Clorhexidina 0.12% c/12h por 10 días.',
    attachments: [],
  },
  {
    id: 'h-5',
    date: '05 Ago 2026',
    time: '10:00',
    type: 'tomography',
    title: 'Tomografía Cone Beam',
    description: 'Evaluación de implante en pieza 36. Hueso adecuado para implante de 10 mm.',
    attachments: [
      'https://images.pexels.com/photos/7800665/pexels-photo-7800665.jpeg?auto=compress&cs=tinysrgb&h=800&w=800',
    ],
  },
];

/** ─── Mock receipts ─── */
export const MOCK_RECEIPTS: ReceiptRow[] = [
  { id: 'r-1', date: 'Lun 15 Sep 2026', dentistName: DENTISTS['1'].name, treatment: 'Limpieza Dental Profunda', amount: 80, depositPaid: 16, status: 'completed' },
  { id: 'r-2', date: 'Mié 10 Sep 2026', dentistName: DENTISTS['3'].name, treatment: 'Urgencia / Dolor Agudo', amount: 60, depositPaid: 0, status: 'cancelled' },
  { id: 'r-3', date: 'Lun 22 Sep 2026', dentistName: DENTISTS['1'].name, treatment: 'Limpieza Dental Profunda', amount: 80, depositPaid: 16, status: 'pending' },
];

