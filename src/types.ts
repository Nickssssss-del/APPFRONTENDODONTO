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

export type Treatment = {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
  /** monto_deposito que calcula el backend. */
  deposit?: number;
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
  /** foto_perfil_url de GET /api/usuarios/yo */
  photoUrl?: string;
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

export type RecoverMethod = 'email' | 'phone';

export type DayLabel = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom';

export type DentistTab = 'dashboard' | 'agenda' | 'patients' | 'history';

export type SessionInfo = {
  user: { id: string; email?: string };
};

export type SessionState = {
  loading: boolean;
  session: SessionInfo | null;
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
