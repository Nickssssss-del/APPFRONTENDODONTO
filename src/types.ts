export type Role = 'patient' | 'dentist';

export type Screen =
  | 'splash'
  | 'tutorial'
  | 'onboarding'
  | 'marketplace'
  | 'checkout'
  | 'patientDashboard'
  | 'misCitas'
  | 'notificaciones'
  | 'dentistPanel'
  | 'chatbot'
  | 'dentistProfile'
  | 'patientProfile'
  | 'confirmarCita';

export type DayLabel = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom';

export type Treatment = {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
};

/** Servicio del catálogo tal como llega de la BD (tabla `servicios` + `categorias_servicio`). */
export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  /** precio_total en soles */
  priceTotal: number;
  /** duracion_minutos */
  durationMin: number;
  /** URL de Cloudinary (o null si el odontólogo aún no subió foto) */
  imageUrl?: string | null;
  dentistName?: string;
  /** monto_deposito de la BD (lo calcula un trigger). Si falta, se estima con guaranteeRate. */
  depositAmount?: number;
  /** Solo como respaldo si no llega depositAmount (0.2 = 20 %). */
  guaranteeRate?: number;
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

export type AppointmentRequestStatus = 'PENDING_APPROVAL' | 'CONFIRMED' | 'RESCHEDULE_REQUESTED';

export type AppointmentRequest = {
  id: string;
  dentistId: string;
  patientName: string;
  patientDni: string;
  patientAge: string;
  patientEmail: string;
  patientPhone: string;
  treatment: Treatment;
  dayLabel: DayLabel;
  selectedDay: string;
  selectedTime: string;
  status: AppointmentRequestStatus;
  createdAt: number;
  rescheduledBy?: 'dentist';
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
  /** distrito_consultorio de la BD; úsalo en vez de parsear `address`. */
  district?: string;
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
  workDays: Record<DayLabel, { active: boolean; start: string; end: string }>;
};

export type ConfirmedAppointment = {
  dentistId: string;
  dayLabel: DayLabel;
  start: string;
  duration: number;
};

export type AppointmentSlot = ConfirmedAppointment & {
  end: string;
  available: boolean;
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
