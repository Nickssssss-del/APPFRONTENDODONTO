import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role, Screen, Treatment, Reservation, UserProfile, DentistTab, SessionInfo } from './types';
import { supabase } from './lib/supabase';

type AppState = {
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
  reservedSlots: Record<string, string[]>;
  setReservedSlots: (slots: Record<string, string[]>) => void;
  isDayAvailable: (dentistId: string, dayLabel: string) => boolean;
  getAvailableTimeSlots: (dentistId: string, dayLabel: string, treatmentDuration: number) => string[];
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
  const [reservedSlots, setReservedSlots] = useState<Record<string, string[]>>({});

  const isDayAvailable = (dentistId: string, dayLabel: string): boolean => {
    const schedule = DENTIST_WORK_SCHEDULE[dentistId];
    if (!schedule || !schedule[dayLabel]) return false;
    return schedule[dayLabel].active;
  };

  const getAvailableTimeSlots = (dentistId: string, dayLabel: string, treatmentDuration: number): string[] => {
    const schedule = DENTIST_WORK_SCHEDULE[dentistId];
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
        reservedSlots, setReservedSlots,
        isDayAvailable,
        getAvailableTimeSlots,
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