import { useState } from 'react';
import {
  Fingerprint, Bell, Calendar, Trash2, LogOut,
  ChevronRight, Key, Phone,
} from 'lucide-react';
import { Toggle } from '@/components/ui';
import { useApp } from '@/store';

interface Props {
  onLogout: () => void;
}

export function SettingsSection({ onLogout }: Props) {
  const {
    biometricEnabled, setBiometricEnabled,
    googleCalendarConnected, setGoogleCalendarConnected,
  } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleDeleteRequest = () => {
    if (
      confirm(
        'Solicitar la eliminación de tus datos personales (Ley N.° 29733). ' +
        'El equipo de soporte procesará tu solicitud en un plazo de 15 días hábiles. ¿Continuar?'
      )
    ) {
      setDeleteRequested(true);
      // INTEGRATION POINT: POST /api/users/me/delete-request
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-slatey-100 divide-y divide-slatey-100">
        {/* Section label */}
        <SectionLabel label="Seguridad y acceso" />

        <SettingsRow
          icon={<Fingerprint className="w-5 h-5 text-primary-500" />}
          label="Biometría / Face ID"
          sub="Desbloquea tu ficha clínica"
          right={<Toggle checked={biometricEnabled} onChange={setBiometricEnabled} />}
        />

        <SettingsRow
          icon={<Key className="w-5 h-5 text-slatey-500" />}
          label="Cambiar contraseña"
          sub="Actualiza tu contraseña de acceso"
          right={<ChevronRight className="w-4 h-4 text-slatey-300" />}
          onClick={() => alert('Cambiar contraseña (integración pendiente)')}
        />

        <SettingsRow
          icon={<Phone className="w-5 h-5 text-slatey-500" />}
          label="Cambiar teléfono"
          sub="Requiere código OTP de verificación"
          right={<ChevronRight className="w-4 h-4 text-slatey-300" />}
          onClick={() => alert('Cambiar teléfono (integración pendiente)')}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slatey-100 divide-y divide-slatey-100">
        <SectionLabel label="Notificaciones e integración" />

        <SettingsRow
          icon={<Bell className="w-5 h-5 text-accent-500" />}
          label="Notificaciones push"
          sub="Recordatorios de citas y novedades"
          right={<Toggle checked={notificationsEnabled} onChange={setNotificationsEnabled} />}
        />

        <SettingsRow
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
          label="Google Calendar"
          sub={googleCalendarConnected ? 'Conectado' : 'No conectado'}
          right={<Toggle checked={googleCalendarConnected} onChange={setGoogleCalendarConnected} />}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slatey-100 divide-y divide-slatey-100">
        <SectionLabel label="Privacidad y cuenta" />

        <SettingsRow
          icon={<Trash2 className="w-5 h-5 text-error-500" />}
          label="Solicitar eliminación de datos"
          sub="Ley N.° 29733 · Datos personales"
          labelClass={deleteRequested ? 'line-through text-slatey-400' : 'text-error-600'}
          right={
            deleteRequested
              ? <span className="text-[11px] text-slatey-400">Solicitado</span>
              : <ChevronRight className="w-4 h-4 text-error-300" />
          }
          onClick={!deleteRequested ? handleDeleteRequest : undefined}
        />
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-error-50 border-2 border-error-100 text-error-600 font-bold text-sm hover:bg-error-100 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </button>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-slatey-400 uppercase tracking-wide">
      {label}
    </p>
  );
}

function SettingsRow({
  icon, label, sub, right, onClick, labelClass = 'text-slatey-900',
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  right: React.ReactNode;
  onClick?: () => void;
  labelClass?: string;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 ${onClick ? 'hover:bg-slatey-50 transition-colors text-left' : ''}`}
    >
      <div className="w-9 h-9 rounded-xl bg-slatey-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${labelClass} truncate`}>{label}</p>
        <p className="text-xs text-slatey-400">{sub}</p>
      </div>
      {right}
    </Tag>
  );
}

