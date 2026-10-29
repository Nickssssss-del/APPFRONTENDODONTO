import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { Role, Screen, Treatment, Reservation, UserProfile, DentistTab, AppointmentRequest, DayLabel } from './types';
import { restoreSession, logout as apiLogout } from './api/auth';
import { SESSION_EXPIRED_EVENT } from './api/http';
import { obtenerYo } from './api/usuarios';
import { activarPush, desactivarPush } from './lib/push';
import { agendaOdontologo, cancelarCita, confirmarCita, misCitas, pagarDeposito, reservarCita, type CitaApi, type MetodoPago } from './api/citas';
import { TREATMENTS, DENTIST_WORK_SCHEDULE, isRealId } from './constants';
import { AppContext } from './storeContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { fechaIsoLima, sumarDias } from '@/lib/format';

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
  /** true cuando ya llegó /api/usuarios/yo (rol real). Antes de eso no se debe elegir panel. */
  perfilListo: boolean;
  rememberMe: boolean;
  setRememberMe: (b: boolean) => void;
  showWelcomeBanner: boolean;
  setShowWelcomeBanner: (b: boolean) => void;
  splashComplete: boolean;
  setSplashComplete: (b: boolean) => void;
  selectedDentistId: string | null;
  setSelectedDentistId: (id: string | null) => void;
  appealCitaId: string | null;
  setAppealCitaId: (id: string | null) => void;
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
  citas: CitaApi[];
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
  /** Odontólogo: confirma una cita (PATCH /api/odontologos/yo/citas/{id}/confirmar) y refresca la agenda. */
  confirmarCitaReal: (id: string) => Promise<void>;
  /** Cita que se está pagando en el checkout (retomada desde Mis citas o el chatbot). */
  activeCita: CitaApi | null;
  setActiveCita: (c: CitaApi | null) => void;
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
  const [perfilListo, setPerfilListo] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const [selectedDentistId, setSelectedDentistId] = useState<string | null>(null);
  const [appealCitaId, setAppealCitaId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Lun 15');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [selectedDentistName, setSelectedDentistName] = useState<string>('');
  const [agendaLocked, setAgendaLocked] = useState(false);
  const [citas, setCitas] = useState<CitaApi[]>([]);
  const [activeCita, setActiveCita] = useState<CitaApi | null>(null);
  const [reschedulingRequestId, setReschedulingRequestId] = useState<string | null>(null);
  const [reservedSlots, setReservedSlots] = useState<Record<string, string[]>>({});
  const [dentistWorkSchedules, setDentistWorkSchedules] = useState<Record<string, Record<string, { active: boolean; start: string; end: string }>>>(DENTIST_WORK_SCHEDULE);

  // Refs para que los callbacks estables vean siempre el rol y la sesión actuales.
  const isAuthRef = useRef(false);
  const roleRef = useRef<Role>('patient');
  isAuthRef.current = isAuth;
  roleRef.current = role;

  const logout = useCallback(() => {
    // Quita el token push de este celular. La petición sale con el access token actual (se lee al instante,
    // antes de que apiLogout lo borre); si falla da igual: el backend descarta tokens inválidos.
    void desactivarPush();
    apiLogout(); // borra access (memoria) y refresh (localStorage)
    isAuthRef.current = false;
    setIsAuth(false);
    setPerfilListo(false);
    setRole('patient');
    setUser({ fullName: '', email: '', phone: '', dni: '', age: '' });
    setCitas([]);
    setActiveCita(null);
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
       const fetched = roleRef.current === 'dentist' ? await agendaOdontologo() : await misCitas();
       if (!isAuthRef.current) return; // se cerró la sesión mientras llegaba la respuesta
       setCitas(fetched);
     } catch (e) {
       console.error('No se pudieron sincronizar las citas', e);
     }
   }, []);

  const reservarYPagar = useCallback(async (odontologoId: string, servicioId: string, inicio: string, metodo: MetodoPago) => {
    const cita = await reservarCita(odontologoId, servicioId, inicio);
    const pago = await pagarDeposito(cita.id, metodo);
    await refreshAppointments();
    if (pago.estado === 'RECHAZADO') {
      // Propagar el error para que el llamante maneje el rechazado
      throw new Error(pago.mensaje ?? 'El pago fue rechazado. Prueba con otro medio de pago.');
    }
    return pago.cita;
  }, [refreshAppointments]);

  const cancelarCitaReal = useCallback(async (id: string, motivo?: string) => {
    await cancelarCita(id, motivo);
    await refreshAppointments();
  }, [refreshAppointments]);

  const confirmarCitaReal = useCallback(async (id: string) => {
    await confirmarCita(id);
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

   const createAppointmentRequest = (_request: Omit<AppointmentRequest, 'id' | 'status' | 'createdAt'>) => {
     // No-op: simulated requests not needed for current UI
   };

   const approveAppointmentRequest = (id: string) => {
     setCitas((prev) =>
       prev.map((cita) =>
         cita.id === id ? { ...cita, estado: 'CONFIRMADA' } : cita
       )
     );
     if (isRealId(id)) {
       // Cita real: la confirma el servidor; si falla, refresh devuelve el estado verdadero.
       confirmarCita(id).then(refreshAppointments).catch((e) => {
         console.error('No se pudo confirmar la cita', e);
         void refreshAppointments();
       });
     }
   };

   const requestAppointmentReschedule = (id: string) => {
     setCitas((prev) =>
       prev.map((cita) =>
         cita.id === id ? { ...cita, estado: 'REPROGRAMADA' } : cita
       )
     );
   };

   const rescheduleAppointmentRequest = (_id: string, _dayLabel: DayLabel, _selectedDay: string, _selectedTime: string) => {
     // No-op: rescheduling logic not needed for current UI
   };

   const dentistRescheduleAppointment = (_id: string, _dayLabel: DayLabel, _selectedDay: string, _selectedTime: string) => {
     // No-op: dentist rescheduling logic not needed for current UI
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
          emailVerified: !!yo.correoVerificado,
        }));
        void activarPush(); // no hace nada mientras VITE_PUSH_ENABLED no sea "true"
      })
      .catch((e) => console.error('No se pudo cargar el perfil', e))
      .finally(() => {
        if (cancelled) return;
        setPerfilListo(true);
        void refreshAppointments();
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

  // Firma heredada: el login con Google real vive en api/auth.ts (POST /api/auth/google) y lo usa GoogleButton.
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
        perfilListo,
        rememberMe, setRememberMe,
        showWelcomeBanner, setShowWelcomeBanner,
        splashComplete, setSplashComplete,
        selectedDentistId, setSelectedDentistId,
        appealCitaId, setAppealCitaId,
        selectedDay, setSelectedDay,
        selectedTime, setSelectedTime,
        selectedSlotStart, setSelectedSlotStart,
        selectedDentistName, setSelectedDentistName,
        agendaLocked, setAgendaLocked,
         citas,
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
        confirmarCitaReal,
        activeCita,
        setActiveCita,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

