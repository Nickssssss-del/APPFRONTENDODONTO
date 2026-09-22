import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, LayoutDashboard, Calendar, Users, FileText, Bot,
} from 'lucide-react';
import { useApp } from '@/store';
import type { DentistTab } from '@/types';
import Dashboard from './dentist/Dashboard';
import Agenda from './dentist/Agenda';
import PatientDetail from './dentist/PatientDetail';
import Patients from './dentist/Patients';
import Profile from './dentist/Profile';

const DOCTOR_AVATAR = 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200';
const DENTIST_NAME = 'Carlos Mendoza';

const TABS: { id: DentistTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'patients', label: 'Pacientes', icon: Users },
  { id: 'history', label: 'Historia', icon: FileText },
];

export default function DentistPanel() {
  const { setSettingsOpen, dentistTab, setDentistTab, selectedPatientId, setSelectedPatientId } = useApp();

  const handleGoToPatient = (id: string) => {
    setSelectedPatientId(id);
    setDentistTab('history');
  };

  const showPatientDetail = dentistTab === 'history' && selectedPatientId !== null;

  return (
    <div className="min-h-screen bg-slatey-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-slatey-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <img src={DOCTOR_AVATAR} alt="Dr. Mendoza" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h2 className="text-lg font-bold text-slatey-900 font-display leading-tight">Dr. {DENTIST_NAME}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                <span className="text-xs text-success-600 font-semibold">Sesión activa</span>
</div>
         </div>
       )
       {/* FAB for Chatbot */}
       <button
         onClick={() => setScreen('chatbot')}
         className="fixed bottom-6 right-4 z-30 w-14 h-14 rounded-full bg-primary-500 shadow-xl shadow-primary-500/30 flex items-center justify-center hover:scale-105 transition-transform"
         data-testid="dentist-chatbot-fab"
       >
         <Bot className="w-6 h-6 text-white" />
         <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
           1
         </span>
       </button>
     </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors"
          >
            <Settings className="w-5 h-5 text-primary-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-5">
        <AnimatePresence mode="wait">
          {showPatientDetail ? (
            <motion.div
              key="patient-detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <PatientDetail
                patientId={selectedPatientId ?? ''}
                onBack={() => {
                  setSelectedPatientId(null);
                  setDentistTab('agenda');
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={dentistTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {dentistTab === 'dashboard' && (
                <Dashboard dentistName={DENTIST_NAME} onGoToAgenda={() => setDentistTab('agenda')} onGoToPatient={handleGoToPatient} />
              )}
              {dentistTab === 'agenda' && <Agenda onGoToPatient={handleGoToPatient} />}
              {dentistTab === 'patients' && <Patients onGoToPatient={handleGoToPatient} />}
              {dentistTab === 'history' && <Profile />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      {!showPatientDetail && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="max-w-md mx-auto bg-white border-t border-slatey-100 px-2 py-2 flex justify-around items-center">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = dentistTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDentistTab(tab.id)}
                  className="relative flex flex-col items-center gap-1 px-3 py-2 transition-colors"
                >
                  {active && (
                    <motion.div
                      layoutId="dentistTabBg"
                      className="absolute inset-0 rounded-2xl bg-primary-50"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 flex flex-col items-center gap-0.5 transition-colors ${active ? 'text-primary-600' : 'text-slatey-400'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
