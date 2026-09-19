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
import ConfirmarCita from './screens/ConfirmarCita';
import SettingsModal from './components/SettingsModal';
import PatientBottomNav from './components/PatientBottomNav';
import type { Screen } from './types';

const PATIENT_SCREENS = new Set<Screen>([
  'patientDashboard',
  'misCitas',
  'notificaciones',
  'marketplace',
  'checkout',
  'confirmarCita',
  'chatbot',
  'dentistProfile',
]);

function AppContent() {
  const { screen } = useApp();
  const isPatientScreen = PATIENT_SCREENS.has(screen);

  return (
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
            {screen === 'confirmarCita' && <ConfirmarCita />}
          </motion.div>
        </AnimatePresence>

        <SettingsModal />
        {isPatientScreen && <PatientBottomNav />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
