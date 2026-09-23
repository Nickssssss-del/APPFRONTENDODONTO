import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role, Screen, Treatment, Reservation, UserProfile, DentistTab, SessionInfo, AppointmentRequest, DayLabel } from './types';
import { supabase } from './lib/supabase';

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('patient');
  const [screen, setScreen] = useState<Screen>('splash');
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
  const [agendaLocked, setAgendaLocked] = useState(false);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [reschedulingRequestId, setReschedulingRequestId] = useState<string | null>(null);
  const [reservedSlots, setReservedSlots] = useState<Record<string, string[]>>({});
  const [dentistWorkSchedules, setDentistWorkSchedules] = useState<Record<string, Record<string, { active: boolean; start: string; end: string }>>>(DENTIST_WORK_SCHEDULE);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session) {
          setSession(data.session);
          setIsAuth(true);
        }
      } catch {
        // ignore — no active session
      } finally {
        if (mounted) setSessionLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        if (sess) {
          setSession(sess);
          setIsAuth(true);
        } else {
          setSession(null);
          setIsAuth(false);
        }
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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

  const loginWithGoogle = async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error('Google auth failed');
      const data = await res.json();
      // Expect backend to return { token: string, user: UserProfile, role: Role }
      if (data.token) {
        localStorage.setItem('jwt', data.token);
      }
      if (data.user) {
        setUser(data.user);
        setRole(data.role || 'patient');
        setIsAuth(true);
        // navigate after auth
        setScreen(data.role === 'dentist' ? 'dentistPanel' : 'patientDashboard');
        if (data.role === 'dentist') setShowWelcomeBanner(true);
      }
    } catch (e) {
      console.error('Google login error', e);
      throw e;
    }
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