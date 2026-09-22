import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './store';
import SplashScreen from './screens/SplashScreen';
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
import SettingsModal from './components/SettingsModal';
import PatientBottomNav from './components/PatientBottomNav';
import { TourProvider, TourTrigger } from './components/Tour';
import type { TourConfig } from './components/Tour';
import type { Screen } from './types';

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

function AppContent() {
  const { screen } = useApp();
  const isPatientScreen = PATIENT_SCREENS.has(screen);

  return (
    <TourProvider>
      <div className="min-h-screen bg-slatey-100">
        {/* Mobile app container - full width, no sidebar */}
        <div className="w-full max-w-md mx-auto min-h-screen bg-slatey-50 relative shadow-xl">
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
