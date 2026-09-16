export type Role = 'patient' | 'dentist';

export type Screen =
  | 'splash'
  | 'onboarding'
  | 'marketplace'
  | 'checkout'
  | 'patientDashboard'
  | 'dentistPanel'
  | 'chatbot'
  | 'dentistProfile';

export type Treatment = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export type PaymentMethod = 'yape' | 'plin' | 'card';

export type ChatMessage = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: number;
};

export type Appointment = {
  time: string;
  doctor: string;
  treatment: string;
  date: string;
  guaranteePaid: boolean;
};

export type Reservation = {
  treatment: Treatment;
  selectedDay: string;
  selectedTime: string;
  paymentMethod: PaymentMethod;
  operationNumber?: string;
};

export type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  dni: string;
  age: string;
};

export type DentistLocation = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  cop: string;
  address: string;
  lat: number;
  lng: number;
  image: string;
  price: number;
};

export type PatientRecord = {
  id: string;
  name: string;
  dni: string;
  age: string;
  lastVisit: string;
  treatment: string;
  status: 'completed' | 'upcoming' | 'cancelled';
  hasOdontogram: boolean;
};

export type RecoverMethod = 'email' | 'phone';

// ---- Dentist module types ----

export type DentistTab = 'dashboard' | 'agenda' | 'patients' | 'history';

export type AppointmentStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

export type AgendaPatient = {
  id: string;
  name: string;
  dni: string;
  age: string;
  time: string;
  treatment: string;
  status: AppointmentStatus;
  guaranteePaid: boolean;
  photo: string;
  phone: string;
  email: string;
  whatsapp: string;
};

export type ClinicalEntry = {
  id: string;
  date: string;
  time: string;
  type: 'evolution' | 'odontogram' | 'xray' | 'tomography' | 'prescription';
  title: string;
  description: string;
  attachments: string[];
};

export type DentistProfile = {
  fullName: string;
  specialty: string;
  cop: string;
  ruc: string;
  email: string;
  phone: string;
  photo: string;
  clinicPhotos: string[];
  workDays: Record<string, { active: boolean; start: string; end: string }>;
};

export type SessionInfo = {
  user: { id: string; email?: string };
};

export type SessionState = {
  loading: boolean;
  session: SessionInfo | null;
};

export type PatientViewMode = 'day' | 'week';

export type WeekDayData = {
  day: string;
  date: string;
  patients: AgendaPatient[];
};

export type CalendarView = 'day' | 'week' | 'month';

export type DaySchedule = {
  dayLabel: string;
  dateNumber: string;
  fullDate: string;
  patients: AgendaPatient[];
};

export type MonthSchedule = {
  dayLabel: string;
  dateNumber: string;
  appointmentCount: number;
};

export type PatientClinicalRecord = {
  id: string;
  name: string;
  dni: string;
  age: string;
  photo: string;
  totalVisits: number;
  lastVisit: string;
  currentTreatment: string;
  history: ClinicalEntry[];
};
