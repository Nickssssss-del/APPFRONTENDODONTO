import { useEffect, useState } from 'react';
import { LogOut, Phone, Check, Bug } from 'lucide-react';
import { useApp } from '../storeHooks';
import { Modal, Button, Input } from './ui';
import { ApiError } from '../api/http';
import { actualizarYo } from '../api/usuarios';

/** Solo en desarrollo: vuelve a mostrar el tour guiado. */
function DebugResetTour() {
  if (!import.meta.env.DEV) return null;
  const resetTour = () => {
    localStorage.removeItem('tour_paciente_visto');
    localStorage.removeItem('tour_doctor_visto');
  };
  return (
    <div className="pt-4 border-t border-slatey-100">
      <p className="text-xs text-slatey-400 text-center mb-3 uppercase tracking-wide">Debug</p>
      <Button variant="outline" fullWidth onClick={resetTour} className="bg-error-50 border-error-200 text-error-600 hover:bg-error-100">
        <Bug className="w-4 h-4 mr-2" /> Resetear tour (paciente + doctor)
      </Button>
    </div>
  );
}

/** Ajustes con datos reales del usuario. Solo ofrece lo que el backend soporta: teléfono y cerrar sesión. */
export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, role, user, setUser, logout, setScreen } = useApp();
  const [telefono, setTelefono] = useState(user.phone);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    if (settingsOpen) {
      setTelefono(user.phone);
      setMsg(null);
    }
  }, [settingsOpen, user.phone]);

  const guardar = async () => {
    if (guardando || !telefono.trim() || telefono.trim() === user.phone) return;
    setGuardando(true);
    setMsg(null);
    try {
      const yo = await actualizarYo({ telefono: telefono.trim() });
      setUser({ ...user, phone: yo.telefono ?? '' });
      setMsg({ ok: true, texto: 'Teléfono actualizado.' });
    } catch (e) {
      setMsg({ ok: false, texto: e instanceof ApiError ? e.message : 'No se pudo actualizar el teléfono.' });
    } finally {
      setGuardando(false);
    }
  };

  const cerrarSesion = () => {
    setSettingsOpen(false);
    logout();
    setScreen('onboarding');
  };

  const inicial = (user.fullName.trim()[0] ?? '?').toUpperCase();

  return (
    <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Configuración y ajustes">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slatey-50">
          <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">{inicial}</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slatey-900 text-sm truncate">{user.fullName || 'Mi cuenta'}</p>
            <p className="text-xs text-slatey-500 truncate">{role === 'dentist' ? 'Odontólogo' : 'Paciente'} · {user.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-slatey-400 uppercase tracking-wide px-1">Contacto</p>
          <Input label="Teléfono" value={telefono} onChange={setTelefono} type="tel" icon={<Phone className="w-5 h-5" />} />
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-xs font-medium ${msg.ok ? 'text-success-600' : 'text-error-600'}`}>{msg.texto}</p>}
          <Button fullWidth loading={guardando} disabled={!telefono.trim() || telefono.trim() === user.phone} onClick={guardar}>
            <Check className="w-4 h-4" /> Guardar teléfono
          </Button>
          {role === 'dentist' && <p className="text-[11px] text-slatey-500">Los datos del consultorio, horarios y cuenta de abono se editan en la pestaña «Perfil».</p>}
        </div>

        <button onClick={cerrarSesion} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-error-50 border-2 border-error-100 text-error-600 font-bold text-sm hover:bg-error-100 transition-colors">
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
        <Button variant="outline" fullWidth onClick={() => setSettingsOpen(false)}>Cerrar</Button>
        <DebugResetTour />
      </div>
    </Modal>
  );
}
