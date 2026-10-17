import { useState } from 'react';
import { LogOut, Phone, Check } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useApp } from '@/storeHooks';
import { ApiError } from '@/api/http';
import { actualizarYo } from '@/api/usuarios';

interface Props {
  onLogout: () => void;
}

/** Ajustes que el backend soporta hoy: actualizar teléfono (PATCH /api/usuarios/yo) y cerrar sesión. */
export function SettingsSection({ onLogout }: Props) {
  const { user, setUser } = useApp();
  const [telefono, setTelefono] = useState(user.phone);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

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

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-slatey-100 p-4 space-y-3">
        <p className="text-[11px] font-bold text-slatey-400 uppercase tracking-wide">Contacto</p>
        <Input label="Teléfono" value={telefono} onChange={setTelefono} type="tel" icon={<Phone className="w-5 h-5" />} />
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-xs font-medium ${msg.ok ? 'text-success-600' : 'text-error-600'}`}>{msg.texto}</p>}
        <Button fullWidth size="sm" loading={guardando} disabled={!telefono.trim() || telefono.trim() === user.phone} onClick={guardar}>
          <Check className="w-4 h-4" /> Guardar teléfono
        </Button>
      </div>

      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-error-50 border-2 border-error-100 text-error-600 font-bold text-sm hover:bg-error-100 transition-colors">
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>
    </div>
  );
}
