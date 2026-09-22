import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Shield, Settings, Key, ArrowLeft
} from 'lucide-react';
import { useApp } from '@/store';
import { Modal, Button, Input } from '@/components/ui';
import { TopBar } from '@/components/ui';

export default function PatientProfile() {
  const { user, setSettingsOpen, screen, setScreen } = useApp();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="min-h-screen bg-slatey-50">
      <TopBar title="Mi Perfil" onBack={() => setScreen('patientDashboard')} rightAction={
        <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-xl hover:bg-slatey-100 transition-colors">
          <Settings className="w-5 h-5 text-slatey-700" />
        </button>
      } />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slatey-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slatey-900 font-display">{user.fullName || 'Paciente'}</h2>
              <p className="text-sm text-slatey-500 mt-1">Paciente registrado</p>
            </div>
          </div>
        </motion.div>

        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slatey-100 space-y-4"
        >
          <h3 className="text-sm font-bold text-slatey-900 uppercase tracking-wide">Información personal</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slatey-50">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-slatey-400">Nombre completo</p>
                <p className="text-sm font-semibold text-slatey-900">{user.fullName || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slatey-50">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-slatey-400">Correo electrónico</p>
                <p className="text-sm font-semibold text-slatey-900">{user.email || 'No registrado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slatey-50">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-slatey-400">Teléfono</p>
                <p className="text-sm font-semibold text-slatey-900">{user.phone || 'No registrado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slatey-50">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-slatey-400">DNI</p>
                <p className="text-sm font-semibold text-slatey-900">{user.dni || '—'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slatey-100 space-y-4"
        >
          <h3 className="text-sm font-bold text-slatey-900 uppercase tracking-wide">Seguridad</h3>
          <Button variant="outline" fullWidth onClick={() => setShowChangePassword(true)} className="justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
              <Key className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slatey-900">Cambiar contraseña</p>
              <p className="text-xs text-slatey-500">Actualiza tu contraseña de acceso</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slatey-300 ml-auto" />
          </Button>
        </motion.div>

        {/* Danger zone (optional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slatey-100"
        >
          <h3 className="text-sm font-bold text-slatey-900 uppercase tracking-wide mb-3">Cuenta</h3>
          <Button variant="danger" fullWidth>
            Cerrar sesión
          </Button>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <Modal open={showChangePassword} onClose={() => setShowChangePassword(false)} title="Cambiar contraseña">
        <div className="space-y-4">
          <p className="text-sm text-slatey-500">Ingresa tu contraseña actual y la nueva.</p>
          <Input label="Contraseña actual" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" />
          <Input label="Nueva contraseña" type="password" value={newPassword} onChange={setNewPassword} placeholder="••••••••" />
          <Input label="Confirmar nueva contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowChangePassword(false)}>Cancelar</Button>
            <Button fullWidth disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}>Guardar cambios</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// need useState import
import { useState } from 'react';