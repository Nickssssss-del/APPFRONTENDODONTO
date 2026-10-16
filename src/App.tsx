import { AnimatePresence, motion } from 'framer-motion';
import { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { AppProvider, useApp } from './store';
import SplashScreen from './screens/SplashScreen';
import WelcomeTutorial from './screens/WelcomeTutorial';
import Onboarding from './screens/Onboarding';
import Marketplace from './screens/Marketplace';
import Checkout from './screens/Checkout';
import PatientDashboard from './screens/PatientDashboard';
import PatientAppointments from './screens/PatientAppointments';
import PatientNotifications from './screens/PatientNotifications';
import DentistPanel from './screens/DentistPanel';
import Chatbot from './screens/Chatbot';
import DentistProfile from './screens/DentistProfile';
import PatientProfile from './screens/PatientProfile';
import ConfirmarCita from './screens/ConfirmarCita';
import DiagnosticoConexion from './screens/DiagnosticoConexion';
import SettingsModal from './components/SettingsModal';
import PatientBottomNav from './components/PatientBottomNav';
import { TourProvider, TourTrigger } from './components/Tour';
import type { TourConfig } from './components/Tour';
import type { Screen } from './types';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slatey-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slatey-900 mb-2">Algo salió mal</h2>
            <p className="text-sm text-slatey-500 mb-6">La aplicación encontró un error inesperado. Por favor, recarga la página.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-2xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PATIENT_SCREENS = new Set<Screen>([
  'patientDashboard',
  'misCitas',
  'notificaciones',
  'marketplace',
  'checkout',
  'confirmarCita',
  'chatbot',
  'patientProfile',
]);

const patientTourConfig: TourConfig = {
  key: 'patient',
  storageKey: 'tour_paciente_visto',
  steps: [
    {
      id: 'nav-inicio',
      targetSelector: '#nav-patientDashboard',
      title: 'Inicio',
      description: 'Tu panel principal con dentistas cercanos, cita del día y acceso rápido.',
      position: 'top',
    },
    {
      id: 'nav-citas',
      targetSelector: '#nav-misCitas',
      title: 'Citas',
      description: 'Gestiona tus citas programadas, historial y reprogramaciones.',
      position: 'top',
    },
    {
      id: 'nav-odontbot',
      targetSelector: '#nav-chatbot',
      title: 'OdontoBot',
      description: 'Asistente IA para orientación dental y resolver dudas al instante.',
      position: 'top',
    },
    {
      id: 'nav-notificaciones',
      targetSelector: '#nav-notificaciones',
      title: 'Notificaciones',
      description: 'Alertas de citas, recordatorios y novedades de tu tratamiento.',
      position: 'top',
    },
    {
      id: 'nav-perfil',
      targetSelector: '#nav-patientProfile',
      title: 'Perfil',
      description: 'Tus datos, historial médico, configuración y preferencias.',
      position: 'top',
    },
  ],
};

const dentistTourConfig: TourConfig = {
  key: 'dentist',
  storageKey: 'tour_doctor_visto',
  steps: [
    {
      id: 'lock-agenda',
      targetSelector: '#dentist-lock-agenda-button',
      title: 'Bloquear agenda',
      description: 'Activa o desactiva la disponibilidad de tu agenda para nuevas citas hoy.',
      position: 'right',
    },
    {
      id: 'pending-requests',
      targetSelector: '#dentist-pending-requests',
      title: 'Solicitudes pendientes',
      description: 'Revisa y aprueba las solicitudes de cita que enviaron los pacientes.',
      position: 'bottom',
    },
    {
      id: 'chatbot-access',
      targetSelector: '[data-testid="dentist-chatbot-fab"]',
      title: 'OdontoBot',
      description: 'Acceso rápido al asistente IA para consultas clínicas y apoyo diagnóstico.',
      position: 'left',
    },
  ],
};

/** Pantallas previas al login: con una sesión válida no deben mostrarse. */
const PRE_AUTH_SCREENS = new Set<Screen>(['splash', 'tutorial', 'onboarding']);

/** Abre el diagnóstico de conexión con el backend: http://localhost:5173/?diagnostico=1 */
const SHOW_DIAGNOSTICO = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('diagnostico');

function AppContent() {
  const { screen, setScreen, isAuth, role, sessionLoading } = useApp();
  const isPatientScreen = PATIENT_SCREENS.has(screen);

  // Sesión restaurada con el refresh token (o login/registro): salta splash, tutorial y login y entra directo
  // al panel que corresponde al rol REAL que devolvió el servidor.
  useEffect(() => {
    if (sessionLoading || !isAuth) return;
    if (PRE_AUTH_SCREENS.has(screen)) {
      setScreen(role === 'dentist' ? 'dentistPanel' : 'patientDashboard');
    }
  }, [sessionLoading, isAuth, role, screen, setScreen]);

  // Protección de rutas: sin sesión no se entra a pantallas de paciente ni al panel del odontólogo.
  // (El marketplace es público en el backend, así que se deja abierto para explorar antes de registrarse.)
  useEffect(() => {
    if (sessionLoading || isAuth) return;
    const PROTEGIDAS = new Set<Screen>(['misCitas', 'notificaciones', 'checkout', 'confirmarCita', 'patientProfile', 'dentistPanel', 'dentistProfile', 'patientDashboard']);
    if (PROTEGIDAS.has(screen)) setScreen('onboarding');
  }, [sessionLoading, isAuth, screen, setScreen]);

  if (SHOW_DIAGNOSTICO) {
    return (
      <div className="min-h-screen bg-slatey-100">
        <div className="w-full max-w-md mx-auto min-h-screen bg-slatey-50 relative shadow-xl">
          <DiagnosticoConexion />
        </div>
      </div>
    );
  }

  return (
    <TourProvider>
      <div className="min-h-screen bg-slatey-100">
        {/* Mobile app container - full width, no sidebar */}
        <div className="w-full max-w-md mx-auto min-h-screen bg-slatey-50 relative shadow-xl">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, x: 30, rotateY: 8 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -30, rotateY: -8 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                style={{ perspective: 1000 }}
              >
                {screen === 'splash' && <SplashScreen />}
                {screen === 'tutorial' && <WelcomeTutorial />}
                {screen === 'onboarding' && <Onboarding />}
                {screen === 'marketplace' && <Marketplace />}
                {screen === 'checkout' && <Checkout />}
                {screen === 'patientDashboard' && <PatientDashboard />}
                {screen === 'misCitas' && <PatientAppointments />}
                {screen === 'notificaciones' && <PatientNotifications />}
                {screen === 'dentistPanel' && <DentistPanel />}
                {screen === 'chatbot' && <Chatbot />}
                {screen === 'dentistProfile' && <DentistProfile />}
                {screen === 'patientProfile' && <PatientProfile />}
                {screen === 'confirmarCita' && <ConfirmarCita />}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>

          <SettingsModal />
          {isPatientScreen && <PatientBottomNav />}

          <TourTrigger config={patientTourConfig} triggerScreen="patientDashboard" />
          <TourTrigger config={dentistTourConfig} triggerScreen="dentistPanel" />
        </div>
      </div>
    </TourProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
