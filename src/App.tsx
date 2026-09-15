import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './store';
import Onboarding from './screens/Onboarding';
import Marketplace from './screens/Marketplace';
import Checkout from './screens/Checkout';
import PatientDashboard from './screens/PatientDashboard';
import DentistPanel from './screens/DentistPanel';
import Chatbot from './screens/Chatbot';
import SettingsModal from './components/SettingsModal';

function AppContent() {
  const { screen } = useApp();

  return (
    <div className="min-h-screen bg-slatey-100 flex justify-center">
      {/* Desktop side panel - visible on large screens */}
      <div className="hidden lg:flex flex-col justify-center w-80 xl:w-96 bg-gradient-to-br from-primary-600 via-primary-700 to-slatey-900 text-white p-12 fixed left-0 top-0 bottom-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center"
            >
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" opacity="0.3"/>
                <path d="M12 6c-2 0-3 1-3 3 0 2 1 4 1 6 0 1 .5 2 2 2s2-1 2-2c0-2 1-4 1-6 0-2-1-3-3-3z"/>
              </svg>
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold font-display">OdontoSystem</h1>
              <p className="text-sm text-primary-200">Tu sonrisa, en buenas manos</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold font-display mb-4 leading-tight">
            La plataforma dental más completa del Perú
          </h2>
          <p className="text-primary-200 text-sm leading-relaxed mb-8">
            Reserva citas con odontólogos verificados, paga con Yape o Plin, y gestiona tu salud bucal en un solo lugar.
          </p>

          <div className="space-y-4">
            {[
              { title: 'Odontólogos verificados', desc: 'Validación en tiempo real vía API del COP' },
              { title: 'Pago seguro', desc: 'Yape, Plin y tarjetas con garantía reembolsable' },
              { title: 'Gobernanza de asistencia', desc: 'Sistema de strikes con apelación médica' },
              { title: 'OdontoBot 24/7', desc: 'Orientación dental al instante' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 rounded-full bg-success-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-primary-200">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="absolute bottom-12 left-12 right-12">
            <div className="flex items-center gap-2 text-xs text-primary-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Datos protegidos · Ley N.º 29733</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile/Tablet app container */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-slatey-50 relative shadow-xl lg:ml-80 xl:ml-96">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 30, rotateY: 8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -30, rotateY: -8 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ perspective: 1000 }}
          >
            {screen === 'onboarding' && <Onboarding />}
            {screen === 'marketplace' && <Marketplace />}
            {screen === 'checkout' && <Checkout />}
            {screen === 'patientDashboard' && <PatientDashboard />}
            {screen === 'dentistPanel' && <DentistPanel />}
            {screen === 'chatbot' && <Chatbot />}
          </motion.div>
        </AnimatePresence>

        <SettingsModal />
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
