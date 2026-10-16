import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { Role, Screen, Treatment, Reservation, UserProfile, DentistTab, SessionInfo, AppointmentRequest, DayLabel } from './types';
import { restoreSession, logout as apiLogout } from './api/auth';
import { SESSION_EXPIRED_EVENT } from './api/http';
import { obtenerYo } from './api/usuarios';
import { agendaOdontologo, cancelarCita, confirmarCita, misCitas, pagarDeposito, reservarCita, type CitaApi, type MetodoPago } from './api/citas';

export type AppState = {
  role: Role;
  setRole: (r: Role) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
  selectedTreatment: Treatment;
  setSelectedTreatment: (t: Treatment) => void;
  reservation: Reservation | null;
  setReservation: (r: Reservation | null) => void;
  holdSeconds: number;
  setHoldSeconds: (n: number) => void;
  isHoldActive: boolean;
  setIsHoldActive: (b: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (b: boolean) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (b: boolean) => void;
  googleCalendarConnected: boolean;
  setGoogleCalendarConnected: (b: boolean) => void;
  attendanceStrikes: number;
  setAttendanceStrikes: (n: number) => void;
  startHold: (seconds?: number) => void;
  stopHold: () => void;
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  isAuth: boolean;
  setIsAuth: (b: boolean) => void;
  dentistTab: DentistTab;
  setDentistTab: (t: DentistTab) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  sessionLoading: boolean;
  session: SessionInfo | null;
  rememberMe: boolean;
  setRememberMe: (b: boolean) => void;
  showWelcomeBanner: boolean;
  setShowWelcomeBanner: (b: boolean) => void;
  splashComplete: boolean;
  setSplashComplete: (b: boolean) => void;
  selectedDentistId: string | null;
  setSelectedDentistId: (id: string | null) => void;
  selectedDay: string;
  setSelectedDay: (d: string) => void;
  selectedTime: string | null;
  setSelectedTime: (t: string | null) => void;
  /** Inicio EXACTO del turno elegido (con zona horaria, tal como lo devuelve /disponibilidad). Es lo que se envía a POST /api/citas. */
  selectedSlotStart: string | null;
  setSelectedSlotStart: (t: string | null) => void;
  /** Nombre del odontólogo elegido en el marketplace (para mostrarlo en confirmación y pago). */
  selectedDentistName: string;
  setSelectedDentistName: (n: string) => void;
  agendaLocked: boolean;
  setAgendaLocked: (locked: boolean) => void;
  appointmentRequests: AppointmentRequest[];
  createAppointmentRequest: (request: Omit<AppointmentRequest, 'id' | 'status' | 'createdAt'>) => void;
  approveAppointmentRequest: (id: string) => void;
  requestAppointmentReschedule: (id: string) => void;
  rescheduleAppointmentRequest: (id: string, dayLabel: DayLabel, selectedDay: string, selectedTime: string) => void;
  dentistRescheduleAppointment: (id: string, dayLabel: DayLabel, selectedDay: string, selectedTime: string) => void;
  reschedulingRequestId: string | null;
  setReschedulingRequestId: (id: string | null) => void;
  reservedSlots: Record<string, string[]>;
  setReservedSlots: (slots: Record<string, string[]>) => void;
  isDayAvailable: (dentistId: string, dayLabel: string) => boolean;
  getAvailableTimeSlots: (dentistId: string, dayLabel: string, treatmentDuration: number) => string[];
  dentistWorkSchedules: Record<string, Record<string, { active: boolean; start: string; end: string }>>;
  setDentistWorkSchedules: (s: Record<string, Record<string, { active: boolean; start: string; end: string }>>) => void;
  loginWithGoogle: (idToken: string) => Promise<void>;
  /** Cierra la sesión: borra tokens y datos del usuario. */
  logout: () => void;
  /** Vuelve a pedir las citas reales al backend (paciente: /api/citas/mias, odontólogo: /api/odontologos/yo/citas). */
  refreshAppointments: () => Promise<void>;
  /** Reserva real en el backend (POST /api/citas) y paga el depósito (POST /api/citas/{id}/pagar). `inicio` = turno exacto de la disponibilidad. */
  reservarYPagar: (odontologoId: string, servicioId: string, inicio: string, metodo: MetodoPago) => Promise<CitaApi>;
  /** Cancela una cita real (PATCH /api/citas/{id}/cancelar). */
  cancelarCitaReal: (id: string, motivo?: string) => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

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

export const DNI_DATABASE: Record<string, { name: string; age: string }> = {
  '12345678': { name: 'María González Fernández', age: '28' },
  '87654321': { name: 'Juan Pérez Rojas', age: '35' },
  '23456789': { name: 'Ana Torres Quispe', age: '42' },
  '34567890': { name: 'Luis Ramírez Soto', age: '31' },
  '45678901': { name: 'Carmen Díaz Vargas', age: '26' },
  '56789012': { name: 'Pedro Castillo Vega', age: '45' },
  '67890123': { name: 'Sofía Mendoza Cruz', age: '33' },
  '78901234': { name: 'Diego Flores Ríos', age: '38' },
};

function parseTimeToMinutes(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/* ───────── sincronización con el backend ───────── */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Las citas reales tienen id UUID; las simuladas locales usan `request-<timestamp>`. */
export const isRealId = (id: string) => UUID_RE.test(id);

/**
 * Convierte una cita del backend al modelo que ya usa la UI.
 * `inicio` llega con la zona del consultorio (ej. 2026-10-20T09:00:00-05:00): se lee la hora tal como viene,
 * sin pasarla por Date, para no mostrar la hora del navegador.
 */
function citaToRequest(c: CitaApi): AppointmentRequest | null {
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('patient');
  const [screen, setScreenRaw] = useState<Screen>('splash');
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment>(TREATMENTS[0]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [holdSeconds, setHoldSeconds] = useState(600);
  const [isHoldActive, setIsHoldActive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(true);
  const [attendanceStrikes, setAttendanceStrikes] = useState(0);
  const [user, setUser] = useState<UserProfile>({
    fullName: 'María González',
    email: '',
    phone: '',
    dni: '',
    age: '',
  });
  const [isAuth, setIsAuth] = useState(false);
  const [dentistTab, setDentistTab] = useState<DentistTab>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const [selectedDentistId, setSelectedDentistId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Lun 15');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [selectedDentistName, setSelectedDentistName] = useState('');
  const [agendaLocked, setAgendaLocked] = useState(false);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [reschedulingRequestId, setReschedulingRequestId] = useState<string | null>(null);
  const [reservedSlots, setReservedSlots] = useState<Record<string, string[]>>({});
  const [dentistWorkSchedules, setDentistWorkSchedules] = useState<Record<string, Record<string, { active: boolean; start: string; end: string }>>>(DENTIST_WORK_SCHEDULE);

  // Refs para que los callbacks estables vean siempre el rol y la sesión actuales.
  const isAuthRef = useRef(false);
  const roleRef = useRef<Role>('patient');
  isAuthRef.current = isAuth;
  roleRef.current = role;

  const logout = useCallback(() => {
    apiLogout(); // borra access (memoria) y refresh (localStorage)
    isAuthRef.current = false;
    setIsAuth(false);
    setRole('patient');
    setUser({ fullName: '', email: '', phone: '', dni: '', age: '' });
    setAppointmentRequests([]);
    setReservedSlots({});
    setSelectedDentistId(null);
    setSelectedTime(null);
    setSelectedSlotStart(null);
    setSelectedDentistName('');
    setReschedulingRequestId(null);
    setShowWelcomeBanner(false);
  }, []);

  // Cualquier salto a "onboarding" con sesión abierta (p. ej. "Cerrar sesión" en Ajustes) cierra la sesión de verdad.
  const setScreen = useCallback((s: Screen) => {
    if (s === 'onboarding' && isAuthRef.current) logout();
    setScreenRaw(s);
  }, [logout]);

  const refreshAppointments = useCallback(async () => {
    if (!isAuthRef.current) return;
    try {
      const citas = roleRef.current === 'dentist' ? await agendaOdontologo() : await misCitas();
      if (!isAuthRef.current) return; // se cerró la sesión mientras llegaba la respuesta
      const reales = citas.map(citaToRequest).filter((r): r is AppointmentRequest => r !== null);
      // Se conservan las solicitudes simuladas locales (id no UUID) y se reemplazan las reales por lo que dice el servidor.
      setAppointmentRequests((current) => [...current.filter((r) => !isRealId(r.id)), ...reales]);
    } catch (e) {
      console.error('No se pudieron sincronizar las citas', e);
    }
  }, []);

  const reservarYPagar = useCallback(async (odontologoId: string, servicioId: string, inicio: string, metodo: MetodoPago) => {
    const cita = await reservarCita(odontologoId, servicioId, inicio);
    const pago = await pagarDeposito(cita.id, metodo);
    await refreshAppointments();
    return pago.cita;
  }, [refreshAppointments]);

  const cancelarCitaReal = useCallback(async (id: string, motivo?: string) => {
    await cancelarCita(id, motivo);
    await refreshAppointments();
  }, [refreshAppointments]);

  const isDayAvailable = (dentistId: string, dayLabel: string): boolean => {
    const schedule = dentistWorkSchedules[dentistId];
    if (!schedule || !schedule[dayLabel]) return false;
    return schedule[dayLabel].active;
  };

  const getAvailableTimeSlots = (dentistId: string, dayLabel: string, treatmentDuration: number): string[] => {
    const schedule = dentistWorkSchedules[dentistId];
    const daySchedule = schedule?.[dayLabel];
    if (!daySchedule || !daySchedule.active) return [];

    const startMin = parseTimeToMinutes(daySchedule.start);
    const endMin = parseTimeToMinutes(daySchedule.end);

    const reservedKey = dentistId + ':' + dayLabel;
    const reserved = reservedSlots[reservedKey] || [];

    const slots: string[] = [];
    const interval = treatmentDuration;
    let cursor = startMin;

    while (cursor + interval <= endMin) {
      const slotStr = formatMinutesToTime(cursor);
      const isRes = reserved.some(
        (r) => r === slotStr || (parseTimeToMinutes(r) < cursor + interval && parseTimeToMinutes(r) + treatmentDuration > cursor)
      );
      if (!isRes) {
        slots.push(slotStr);
      }
      cursor += interval;
    }

    return slots;
  };

  const reserveSlot = (dentistId: string, dayLabel: string, time: string) => {
    const reservedKey = dentistId + ':' + dayLabel;
    setReservedSlots((current) => ({
      ...current,
      [reservedKey]: Array.from(new Set([...(current[reservedKey] || []), time])),
    }));
  };

  const releaseSlot = (dentistId: string, dayLabel: string, time: string) => {
    const reservedKey = dentistId + ':' + dayLabel;
    setReservedSlots((current) => ({
      ...current,
      [reservedKey]: (current[reservedKey] || []).filter((reservedTime) => reservedTime !== time),
    }));
  };

  const createAppointmentRequest = (request: Omit<AppointmentRequest, 'id' | 'status' | 'createdAt'>) => {
    if (reschedulingRequestId) {
      rescheduleAppointmentRequest(reschedulingRequestId, request.dayLabel, request.selectedDay, request.selectedTime);
      return;
    }

    const newRequest: AppointmentRequest = {
      ...request,
      id: `request-${Date.now()}`,
      status: 'PENDING_APPROVAL',
      createdAt: Date.now(),
    };
    setAppointmentRequests((current) => [...current, newRequest]);
    reserveSlot(request.dentistId, request.dayLabel, request.selectedTime);
  };

  const approveAppointmentRequest = (id: string) => {
    setAppointmentRequests((current) => current.map((request) => (
      request.id === id ? { ...request, status: 'CONFIRMED' } : request
    )));
    if (isRealId(id)) {
      // Cita real: la confirma el servidor; si falla, refresh devuelve el estado verdadero.
      confirmarCita(id).then(refreshAppointments).catch((e) => {
        console.error('No se pudo confirmar la cita', e);
        void refreshAppointments();
      });
    }
  };

  const requestAppointmentReschedule = (id: string) => {
    const request = appointmentRequests.find((item) => item.id === id);
    if (!request) return;
    releaseSlot(request.dentistId, request.dayLabel, request.selectedTime);
    setAppointmentRequests((current) => current.map((item) => (
      item.id === id ? { ...item, status: 'RESCHEDULE_REQUESTED' } : item
    )));
  };

  const rescheduleAppointmentRequest = (id: string, dayLabel: DayLabel, selectedDay: string, selectedTime: string) => {
    const request = appointmentRequests.find((item) => item.id === id);
    if (!request) return;
    releaseSlot(request.dentistId, request.dayLabel, request.selectedTime);
    reserveSlot(request.dentistId, dayLabel, selectedTime);
    setAppointmentRequests((current) => current.map((item) => (
      item.id === id
        ? { ...item, dayLabel, selectedDay, selectedTime, status: 'PENDING_APPROVAL', createdAt: Date.now() }
        : item
    )));
    setReschedulingRequestId(null);
  };

  const dentistRescheduleAppointment = (id: string, dayLabel: DayLabel, selectedDay: string, selectedTime: string) => {
    const request = appointmentRequests.find((item) => item.id === id);
    if (!request) return;
    releaseSlot(request.dentistId, request.dayLabel, request.selectedTime);
    reserveSlot(request.dentistId, dayLabel, selectedTime);
    setAppointmentRequests((current) => current.map((item) => (
      item.id === id
        ? { ...item, dayLabel, selectedDay, selectedTime, status: 'CONFIRMED', rescheduledBy: 'dentist', createdAt: Date.now() }
        : item
    )));
  };

  // Sesión: el backend (JWT propio) es la única fuente. Supabase solo es la base de datos y su API está cerrada.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ok = await restoreSession();
        if (mounted && ok) setIsAuth(true); // los datos del usuario los carga el efecto de más abajo
      } catch {
        // sin sesión activa
      } finally {
        if (mounted) setSessionLoading(false);
      }
    })();

    const onExpired = () => {
      logout();
      setScreenRaw('onboarding');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      mounted = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, [logout]);

  // Con sesión abierta (login, registro o sesión restaurada): trae el perfil real y las citas, y las mantiene al día.
  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;

    obtenerYo()
      .then((yo) => {
        if (cancelled) return;
        setRole(yo.rol === 'ODONTOLOGO' ? 'dentist' : 'patient');
        setUser((u) => ({
          ...u,
          fullName: yo.nombreCompleto,
          email: yo.correo,
          phone: yo.telefono ?? u.phone,
          dni: yo.numeroDocumento,
        }));
      })
      .catch((e) => console.error('No se pudo cargar el perfil', e))
      .finally(() => {
        if (!cancelled) void refreshAppointments();
      });

    const timer = setInterval(() => void refreshAppointments(), 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshAppointments(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuth, refreshAppointments]);

  useEffect(() => {
    if (!isHoldActive) return;
    const interval = setInterval(() => {
      setHoldSeconds((prev) => {
        if (prev <= 1) {
          setIsHoldActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isHoldActive]);

  const startHold = (seconds = 600) => {
    setHoldSeconds(seconds);
    setIsHoldActive(true);
  };

  const stopHold = () => {
    setIsHoldActive(false);
    setHoldSeconds(600);
  };

  // El backend (AuthController) solo expone /register, /login y /refresh: todavía NO existe /api/auth/google.
  // Se deja la firma para no romper la UI, pero se informa con claridad en vez de llamar a un endpoint inexistente.
  const loginWithGoogle = async (_idToken: string): Promise<void> => {
    throw new Error('El inicio de sesión con Google aún no está disponible. Usa tu correo y contraseña.');
  };

  return (
    <AppContext.Provider
      value={{
        role, setRole,
        screen, setScreen,
        selectedTreatment, setSelectedTreatment,
        reservation, setReservation,
        holdSeconds, setHoldSeconds,
        isHoldActive, setIsHoldActive,
        settingsOpen, setSettingsOpen,
        biometricEnabled, setBiometricEnabled,
        googleCalendarConnected, setGoogleCalendarConnected,
        attendanceStrikes, setAttendanceStrikes,
        startHold, stopHold,
        user, setUser,
        isAuth, setIsAuth,
        dentistTab, setDentistTab,
        selectedPatientId, setSelectedPatientId,
        sessionLoading,
        session,
        rememberMe, setRememberMe,
        showWelcomeBanner, setShowWelcomeBanner,
        splashComplete, setSplashComplete,
        selectedDentistId, setSelectedDentistId,
        selectedDay, setSelectedDay,
        selectedTime, setSelectedTime,
        selectedSlotStart, setSelectedSlotStart,
        selectedDentistName, setSelectedDentistName,
        agendaLocked, setAgendaLocked,
        appointmentRequests,
        createAppointmentRequest,
        approveAppointmentRequest,
        requestAppointmentReschedule,
        rescheduleAppointmentRequest,
        dentistRescheduleAppointment,
        reschedulingRequestId,
        setReschedulingRequestId,
        reservedSlots, setReservedSlots,
        isDayAvailable,
        getAvailableTimeSlots,
        dentistWorkSchedules,
        setDentistWorkSchedules,
        loginWithGoogle,
        logout,
        refreshAppointments,
        reservarYPagar,
        cancelarCitaReal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}