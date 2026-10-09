import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/store';

import { ProfileHeader }    from './ProfileHeader';
import { TabBar }           from './TabBar';
import { ResumenTab }       from './ResumenTab';
import { HistorialTab }     from './HistorialTab';
import { OdontogramaTab }   from './OdontogramaTab';
import { ComprobantesTab }  from './ComprobantesTab';
import { SettingsSection }  from './SettingsSection';
import { ResumenSkeleton }  from './States';

import { MOCK_APPOINTMENTS, MOCK_HISTORY, MOCK_RECEIPTS } from './mockData';
import type { ProfileTab, LoadState, PatientAppointmentRow } from './types';
import type { ClinicalEntry } from '@/types';

export default function PatientProfileScreen() {
  const {
    user, setScreen, setIsAuth,
    appointmentRequests,
    setSelectedDentistId,
  } = useApp();

  const [tab, setTab]             = useState<ProfileTab>('resumen');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ── Independent loading states (resumen loads first) ──────────────────────
  const [summaryState, setSummaryState] = useState<LoadState>('loading');
  const [historyState, setHistoryState] = useState<LoadState>('loading');
  const [historyError, setHistoryError] = useState(false);

  const [appointments, setAppointments] = useState<PatientAppointmentRow[]>([]);
  const [history, setHistory]           = useState<ClinicalEntry[]>([]);

  // Simulate loading summary (fast — no clinical data)
  useEffect(() => {
    const t = setTimeout(() => {
      setAppointments(MOCK_APPOINTMENTS);
      setSummaryState('ready');
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // Simulate loading clinical history (slower — deferred)
  useEffect(() => {
    if (tab !== 'historial' && tab !== 'odontograma') return; // lazy load
    if (historyState !== 'loading') return;
    const t = setTimeout(() => {
      // Clinical data NEVER written to localStorage — session-only
      setHistory(MOCK_HISTORY);
      setHistoryState('ready');
      setHistoryError(false);
    }, 900);
    return () => clearTimeout(t);
  }, [tab, historyState]);

  const retryHistory = useCallback(() => {
    setHistoryState('loading');
    setHistoryError(false);
  }, []);

  // Merge real requests from store with mock data
  const allAppointments = useMemo<PatientAppointmentRow[]>(() => {
    const fromStore: PatientAppointmentRow[] = appointmentRequests.map((req) => ({
      id: req.id,
      dentistId: req.dentistId,
      dentistName: 'Dr. Carlos Mendoza',
      dentistImage: 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
      specialty: 'Odontólogo General',
      address: 'Av. Javier Prado 1234, San Isidro',
      date: req.selectedDay,
      time: req.selectedTime,
      treatment: req.treatment.name,
      status: 'upcoming-pending' as const,
      guaranteePaid: true,
      guaranteeAmount: Math.round(req.treatment.price * 0.2),
      period: 'upcoming' as const,
      strikes: 0,
    }));
    return [...fromStore, ...appointments];
  }, [appointmentRequests, appointments]);

  const strikes = useMemo(
    () => Math.max(0, ...allAppointments.map((a) => a.strikes)),
    [allAppointments]
  );

  const handleAvatarChange = (file: File) => {
    // INTEGRATION POINT: upload to Cloudinary / backend and get URL back
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
    // Revoke previous object URL on next change to avoid memory leaks
  };

  const handleLogout = () => {
    setIsAuth(false);
    setScreen('onboarding');
  };

  const handleViewDentist = (id: string) => {
    setSelectedDentistId(id);
    setScreen('dentistProfile');
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-slatey-50">
      {/* ── Fixed top navigation ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 sticky top-0 z-30 glass border-b border-slatey-100">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <button
            onClick={() => setScreen('patientDashboard')}
            aria-label="Volver al inicio"
            className="p-2 -ml-2 rounded-xl hover:bg-slatey-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slatey-700" />
          </button>
          <h2 className="text-lg font-bold text-slatey-900 font-display flex-1">Mi perfil</h2>
        </div>
      </div>

      {/* ── Scrollable area ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {/* Profile header — always visible */}
        <ProfileHeader
          user={user}
          avatarUrl={avatarUrl}
          onAvatarChange={handleAvatarChange}
        />

        {/* Tab bar — sticky below header */}
        <TabBar active={tab} onChange={setTab} />

        {/* Tab panels */}
        <div className="max-w-md mx-auto pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {tab === 'resumen' && (
                summaryState === 'loading'
                  ? <ResumenSkeleton />
                  : (
                    <>
                      <ResumenTab
                        appointments={allAppointments}
                        strikes={strikes}
                        onReserve={() => setScreen('marketplace')}
                        onViewDentist={handleViewDentist}
                      />
                      <SettingsSection onLogout={handleLogout} />
                    </>
                  )
              )}

              {tab === 'historial' && (
                <HistorialTab
                  entries={history}
                  loading={historyState === 'loading'}
                  error={historyError}
                  onRetry={retryHistory}
                  onReserve={() => setScreen('marketplace')}
                />
              )}

              {tab === 'odontograma' && <OdontogramaTab />}

              {tab === 'comprobantes' && (
                <ComprobantesTab
                  receipts={MOCK_RECEIPTS}
                  onReserve={() => setScreen('marketplace')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

