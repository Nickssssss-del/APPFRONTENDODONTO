import type { ClinicalEntry } from '@/types';

export type ProfileTab = 'resumen' | 'historial' | 'odontograma' | 'comprobantes';

export type LoadState = 'loading' | 'ready' | 'error';

export interface PatientAppointmentRow {
  id: string;
  dentistId: string;
  dentistName: string;
  dentistImage: string;
  specialty: string;
  address: string;
  date: string;
  time: string;
  treatment: string;
  status: 'upcoming-confirmed' | 'upcoming-pending' | 'upcoming-reschedule' | 'completed' | 'cancelled';
  guaranteePaid: boolean;
  guaranteeAmount: number;
  period: 'upcoming' | 'past';
  strikes: number;
}

export interface ReceiptRow {
  id: string;
  date: string;
  dentistName: string;
  treatment: string;
  amount: number;
  depositPaid: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export type EntryType = ClinicalEntry['type'];

