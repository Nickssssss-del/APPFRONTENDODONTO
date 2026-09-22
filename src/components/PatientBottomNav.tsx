import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store';
import {
  Home, Calendar, MessageCircle, Bell, User,
} from 'lucide-react';

type NavKey = 'patientDashboard' | 'misCitas' | 'chatbot' | 'notificaciones' | 'patientProfile';

const NAV_ITEMS: { key: NavKey; label: string; icon: ReactNode }[] = [
  { key: 'patientDashboard', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
  { key: 'misCitas', label: 'Citas', icon: <Calendar className="w-5 h-5" /> },
  { key: 'chatbot', label: 'OdontoBot', icon: <MessageCircle className="w-5 h-5" /> },
  { key: 'notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> },
  { key: 'patientProfile', label: 'Perfil', icon: <User className="w-5 h-5" /> },
];

export default function PatientBottomNav() {
  const { screen, setScreen } = useApp();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-md px-4 pb-4 pointer-events-auto">
        <div className="relative flex items-center justify-between gap-1 rounded-3xl bg-white/95 backdrop-blur-xl shadow-xl shadow-slatey-900/10 border border-slatey-100 px-2 py-2">
{NAV_ITEMS.map((item) => {
             const active = screen === item.key;
             const isCenter = item.key === 'chatbot';
             return (
<button
                  key={item.key}
                  onClick={() => setScreen(item.key)}
                  data-testid={item.key}
                  id={`nav-${item.key}`}
                  className={`relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                    isCenter ? 'flex-1' : 'flex-1'
                  }`}
                >
                {isCenter ? (
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                      active ? 'bg-gradient-to-br from-primary-500 to-success-500 shadow-primary-500/40' : 'bg-primary-500 shadow-primary-500/30'
                    }`}
                  >
                    <motion.div
                      animate={active ? { rotate: [0, -8, 8, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {item.icon}
                    </motion.div>
                    <span className="sr-only">{item.label}</span>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: active ? 1.15 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={`flex items-center justify-center transition-colors duration-200 ${
                        active ? 'text-primary-600' : 'text-slatey-400'
                      }`}
                    >
                      {item.icon}
                    </motion.div>
                    <span
                      className={`text-[10px] font-semibold transition-all duration-200 overflow-hidden ${
                        active ? 'text-primary-600 max-h-4 opacity-100' : 'text-slatey-400 max-h-0 opacity-0'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
                {active && !isCenter && (
                  <motion.div
                    layoutId="navDot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}