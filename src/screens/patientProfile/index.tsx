import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/storeHooks';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import { subirFotoPerfil, validarImagen } from '@/api/archivos';
import { misHistorias, miReputacion } from '@/api/panel';
import { ProfileHeader } from './ProfileHeader';
import { TabBar } from './TabBar';
import { ResumenTab } from './ResumenTab';
import { HistorialTab } from './HistorialTab';
import { ComprobantesTab } from './ComprobantesTab';
import { SettingsSection } from './SettingsSection';
import { MisReclamos } from '@/components/reclamos/MisReclamos';
import type { ProfileTab } from './types';

export default function PatientProfileScreen() {
  const { user, setUser, setScreen, logout, citas, cancelarCitaReal, setSelectedDentistId } = useApp();
  const [tab, setTab] = useState<ProfileTab>('resumen');
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const historias = useAsync((signal) => misHistorias(signal), []);
  const reputacion = useAsync((signal) => miReputacion(signal), []);

  const ordenadas = useMemo(() => [...citas].sort((a, b) => b.inicio.localeCompare(a.inicio)), [citas]);

  const handleAvatarChange = async (file: File) => {
    const err = validarImagen(file);
    if (err) return setAvatarError(err);
    try {
      const r = await subirFotoPerfil(file);
      setUser({ ...user, photoUrl: r.fotoPerfilUrl });
      setAvatarError(null);
    } catch (e) {
      setAvatarError(e instanceof ApiError ? e.message : 'No se pudo cambiar la foto.');
    }
  };

  const handleLogout = () => {
    logout(); // revoca el refresh token y borra la sesión
    setScreen('onboarding');
  };

  const handleViewDentist = (id: string) => {
    setSelectedDentistId(id);
    setScreen('dentistProfile');
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-slatey-50">
      <div className="flex-shrink-0 sticky top-0 z-30 glass border-b border-slatey-100">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <button onClick={() => setScreen('patientDashboard')} aria-label="Volver al inicio" className="p-2.5 -ml-2 rounded-xl hover:bg-slatey-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slatey-700" />
          </button>
          <h2 className="text-lg font-bold text-slatey-900 font-display flex-1">Mi perfil</h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <ProfileHeader user={user} avatarUrl={user.photoUrl ?? null} onAvatarChange={handleAvatarChange} />
        {avatarError && <p role="alert" className="px-4 pt-2 text-xs font-medium text-error-600 max-w-md mx-auto">{avatarError}</p>}
        <TabBar active={tab} onChange={setTab} />

        <div className="max-w-md mx-auto pb-10">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
              {tab === 'resumen' && (
                <>
                  <ResumenTab
                    citas={ordenadas}
                    strikes={reputacion.data?.strikes ?? 0}
                    limiteStrikes={reputacion.data?.limiteStrikes ?? 3}
                    onReserve={() => setScreen('marketplace')}
                    onViewDentist={handleViewDentist}
                    onCancel={cancelarCitaReal}
                    onAppeal={() => setScreen('patientDashboard')}
                  />
                  <SettingsSection onLogout={handleLogout} onCuentaEliminada={handleLogout} />
                </>
              )}
              {tab === 'historial' && (
                <HistorialTab entries={historias.data ?? []} loading={historias.loading} error={historias.error} onRetry={historias.reload} onReserve={() => setScreen('marketplace')} />
              )}
              {tab === 'comprobantes' && <ComprobantesTab citas={ordenadas} onReserve={() => setScreen('marketplace')} />}
              {tab === 'reclamos' && (
                <div id="panel-reclamos" role="tabpanel" aria-labelledby="tab-reclamos">
                  <MisReclamos citas={ordenadas} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
