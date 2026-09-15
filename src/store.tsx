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
};

const AppContext = createContext<AppState | null>(null);

export const TREATMENTS: Treatment[] = [
  { id: 'limpieza', name: 'Limpieza Dental Profunda', price: 80, description: 'Profilaxis completa con ultrasonido y pulido' },
  { id: 'consulta', name: 'Consulta General / Diagnóstico', price: 50, description: 'Evaluación clínica y plan de tratamiento' },
  { id: 'urgencia', name: 'Urgencia / Dolor Agudo', price: 60, description: 'Atención inmediata para dolor agudo' },
];

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('patient');
  const [screen, setScreen] = useState<Screen>('onboarding');
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
