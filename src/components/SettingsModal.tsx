import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Fingerprint, FileText, Calendar, Clock, Building2,
  ShieldCheck, ChevronRight, ArrowLeft, Loader2, CheckCircle2,
  RotateCcw, Bug
} from 'lucide-react';
import { useApp } from '../store';
import { Modal, Button, Badge, Input, Toggle } from './ui';

function DebugResetTour() {
  const resetTour = () => {
    localStorage.removeItem('tour_paciente_visto');
    localStorage.removeItem('tour_doctor_visto');
    console.log('✅ Tour flags reset. Refresh to see tour again.');
  };

  return (
    <div className="pt-4 border-t border-slatey-100">
      <p className="text-xs text-slatey-400 text-center mb-3 uppercase tracking-wide">Debug</p>
      <Button variant="outline" fullWidth onClick={resetTour} className="bg-error-50 border-error-200 text-error-600 hover:bg-error-100">
        <Bug className="w-4 h-4 mr-2" />
        Resetear tour (paciente + doctor)
      </Button>
    </div>
  );
}

export default function SettingsModal() {
  const {
    settingsOpen, setSettingsOpen, role,
    biometricEnabled, setBiometricEnabled,
    googleCalendarConnected, setGoogleCalendarConnected,
  setScreen,
  } = useApp();
  const [phoneStep, setPhoneStep] = useState<'form' | 'otp'>('form');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpDone, setOtpDone] = useState(false);
  const [tolerance, setTolerance] = useState(15);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [bankAccount, setBankAccount] = useState('');

  const handleClose = () => {
    setSettingsOpen(false);
    setPhoneStep('form');
    setOtp('');
    setNewPhone('');
    setOtpDone(false);
  };

  const handleOtpVerify = () => {
    setOtpLoading(true);
    setTimeout(() => {
      setOtpLoading(false);
      setOtpDone(true);
      setTimeout(() => {
        setPhoneStep('form');
        setOtpDone(false);
        setOtp('');
        setNewPhone('');
      }, 1500);
    }, 1500);
  };

  return (
    <Modal open={settingsOpen} onClose={handleClose} title="Configuración & Ajustes">
      <AnimatePresence mode="wait">
        {phoneStep === 'form' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Profile header */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slatey-50">
              <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {role === 'patient' ? 'M' : 'C'}
                </span>
              </div>
              <div>
                <p className="font-bold text-slatey-900 text-sm">
                  {role === 'patient' ? 'María González' : 'Dr. Carlos Mendoza'}
                </p>
                <p className="text-xs text-slatey-500">
                  {role === 'patient' ? 'Paciente' : 'Odontólogo · COP 34512'}
                </p>
              </div>
            </div>

            {/* Patient Settings */}
            {role === 'patient' && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slatey-400 uppercase tracking-wide px-1 mb-2">Cuenta</p>

                <button
                  onClick={() => setPhoneStep('otp')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slatey-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slatey-900">Cambiar teléfono</p>
                    <p className="text-xs text-slatey-500">Requiere verificación OTP</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slatey-300" />
                </button>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slatey-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Fingerprint className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slatey-900">Biometría Face ID</p>
                    <p className="text-xs text-slatey-500">Acceso a ficha médica</p>
                  </div>
                  <Toggle checked={biometricEnabled} onChange={setBiometricEnabled} />
                </div>

                <button
                  onClick={() => { handleClose(); setScreen('onboarding'); }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slatey-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-slatey-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slatey-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slatey-900">Ley N.º 29733 (Mis Datos)</p>
                    <p className="text-xs text-slatey-500">Protección de datos personales</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slatey-300" />
                </button>
              </div>
            )}

            {/* Dentist Settings */}
            {role === 'dentist' && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slatey-400 uppercase tracking-wide px-1 mb-2">Integración</p>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slatey-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slatey-900">Google Calendar</p>
                    <p className="text-xs text-slatey-500">
                      {googleCalendarConnected ? 'Conectado' : 'No conectado'}
                    </p>
                  </div>
                  <Toggle checked={googleCalendarConnected} onChange={setGoogleCalendarConnected} />
                </div>

                <p className="text-xs font-bold text-slatey-400 uppercase tracking-wide px-1 mb-2 mt-4">Jornada laboral</p>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Inicio" value={workStart} onChange={setWorkStart} type="time" />
                  <Input label="Fin" value={workEnd} onChange={setWorkEnd} type="time" />
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slatey-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slatey-500" />
                      <span className="text-sm font-semibold text-slatey-900">Tolerancia</span>
                    </div>
                    <Badge variant="accent" size="sm">{tolerance} min</Badge>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={5}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                  <div className="flex justify-between text-xs text-slatey-400 mt-1">
                    <span>5 min</span>
                    <span>30 min</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slatey-400 uppercase tracking-wide px-1 mb-2 mt-4">Pagos</p>

                <div className="p-3.5 rounded-2xl bg-white border border-slatey-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-slatey-500" />
                    <span className="text-sm font-semibold text-slatey-900">Cuenta bancaria / CCI</span>
                  </div>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="000-000-0000000000-00"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slatey-200 bg-slatey-50 focus:border-primary-400 focus:bg-white focus:outline-none text-sm font-mono"
                  />
                  <p className="text-xs text-slatey-400 mt-1.5">Para abono de garantías liquidadas</p>
                </div>
              </div>
            )}

            {/* Common */}
            <div className="pt-2">
              <Button variant="outline" fullWidth onClick={handleClose}>
                Cerrar
              </Button>
            </div>

            <DebugResetTour />
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <button
              onClick={() => setPhoneStep('form')}
              className="flex items-center gap-2 text-sm text-slatey-500 hover:text-slatey-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>

            {otpDone ? (
              <div className="flex flex-col items-center text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-9 h-9 text-success-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-slatey-900 mb-1">Teléfono actualizado</h3>
                <p className="text-sm text-slatey-500">Tu nuevo número ha sido verificado.</p>
              </div>
            ) : (
              <>
                <div>
                  <Input
                    label="Nuevo teléfono"
                    value={newPhone}
                    onChange={setNewPhone}
                    placeholder="999 888 777"
                    type="tel"
                    icon={<Phone className="w-5 h-5" />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Código OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slatey-200 bg-slatey-50 focus:border-primary-400 focus:bg-white focus:outline-none text-center text-lg font-bold tracking-widest"
                  />
                </div>
                <Button fullWidth loading={otpLoading} disabled={otp.length < 6} onClick={handleOtpVerify}>
                  Verificar y guardar
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
