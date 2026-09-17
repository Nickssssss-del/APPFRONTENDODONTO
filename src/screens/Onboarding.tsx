import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Phone, CreditCard, BadgeCheck, ArrowRight, Lock, Mail,
  KeyRound, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Loader2,
  Smartphone, RotateCcw, User as UserIcon,
} from 'lucide-react';
import { useApp, DNI_DATABASE } from '../store';
import { Button, Input, Badge } from '../components/ui';
import { supabase } from '@/lib/supabase';
import type { RecoverMethod } from '../types';

type AuthStep = 'login' | 'register' | 'recover' | 'recoverOTP' | 'success' | 'error';

export default function Onboarding() {
  const {
    role,
    setRole,
    setScreen,
    setUser,
    setIsAuth,
    isAuth,
    rememberMe,
    setRememberMe,
    setShowWelcomeBanner,
    sessionLoading,
    session,
    selectedDentistId,
    setSelectedDentistId,
    selectedDay,
    setSelectedDay,
    selectedTime,
    setSelectedTime,
  } = useApp();

  const resetPatientNavigationState = () => {
    setSelectedDentistId(null);
    setSelectedDay('Lun 15');
    setSelectedTime(null);
  };

  useEffect(() => {
    if (sessionLoading) return;
    if (session && isAuth) {
      resetPatientNavigationState();
      setScreen(role === 'patient' ? 'marketplace' : 'dentistPanel');
      if (role === 'dentist') setShowWelcomeBanner(true);
    }
  }, [sessionLoading, session, role]);
  const [step, setStep] = useState<AuthStep>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [cop, setCop] = useState('');
  const [ruc, setRuc] = useState('');
  const [copValidated, setCopValidated] = useState(false);
  const [recoverMethod, setRecoverMethod] = useState<RecoverMethod>('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(300);
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== 'recoverOTP') return;
    const interval = setInterval(() => {
      setOtpTimer((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (role === 'dentist' && cop.length >= 5 && !copValidated) {
      const t = setTimeout(() => setCopValidated(true), 800);
      return () => clearTimeout(t);
    }
  }, [cop, copValidated, role, cop.length]);

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      setStep('error');
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const dniKey = Object.keys(DNI_DATABASE).find((k) =>
        DNI_DATABASE[k].name.toLowerCase().includes(email.split('@')[0].toLowerCase())
      );
      const profileData = DNI_DATABASE[dniKey || '12345678'] || DNI_DATABASE['12345678'];
      setUser({
        fullName: profileData.name,
        email,
        phone: phone || '999 888 777',
        dni: dniKey || '12345678',
        age: profileData.age,
      });
      setIsAuth(true);
      resetPatientNavigationState();
      setScreen(role === 'patient' ? 'marketplace' : 'dentistPanel');
      if (role === 'dentist') setShowWelcomeBanner(true);
      setStep('success');
    } catch {
      setErrorMsg('Credenciales incorrectas. Verifica tu correo y contraseña.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrorMsg('');
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      setStep('error');
      setLoading(false);
      return;
    }
    if (!email || !password || !phone) {
      setErrorMsg('Por favor completa todos los campos.');
      setStep('error');
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const dniKey = dni || '12345678';
      const profileData = DNI_DATABASE[dniKey] || DNI_DATABASE['12345678'];
      setUser({
        fullName: profileData.name,
        email,
        phone,
        dni: dniKey,
        age: profileData.age,
      });
      setIsAuth(true);
      if (role === 'dentist') setShowWelcomeBanner(true);
      setStep('success');
    } catch {
      setErrorMsg('No se pudo crear la cuenta. Es posible que el correo ya esté registrado.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverSend = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('recoverOTP');
      setOtpTimer(300);
      setOtp(['', '', '', '', '', '']);
    }, 1200);
  };

  const handleRecoverVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (newPassword.length < 6) {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
        setStep('error');
        return;
      }
      setStep('success');
    }, 1500);
  };

  const handleEnter = () => {
    setScreen(role === 'patient' ? 'marketplace' : 'dentistPanel');
  };

  const otpComplete = otp.every((d) => d !== '');

  const goBack = () => {
    setStep('login');
    setErrorMsg('');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-slatey-50 to-slatey-50 flex flex-col">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 -left-20 w-72 h-72 rounded-full bg-primary-200/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 -right-20 w-72 h-72 rounded-full bg-accent-200/20 blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="relative px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30"
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" opacity="0.2"/>
              <path d="M12 6c-2 0-3 1-3 3 0 2 1 4 1 6 0 1 .5 2 2 2s2-1 2-2c0-2 1-4 1-6 0-2-1-3-3-3z"/>
            </svg>
          </motion.div>
          <div>
            <h1 className="text-xl font-extrabold text-slatey-900 font-display leading-none">OdontoSystem</h1>
            <p className="text-xs text-slatey-500 mt-0.5">Tu sonrisa, en buenas manos</p>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-extrabold text-slatey-900 font-display mb-1"
        >
          {step === 'success' ? '¡Bienvenido!' : step === 'login' ? 'Inicia sesión' : step === 'register' ? 'Crea tu cuenta' : step === 'recover' ? 'Recuperar contraseña' : step === 'recoverOTP' ? 'Verifica tu identidad' : 'Algo salió mal'}
        </motion.h2>
        <p className="text-sm text-slatey-500">
          {step === 'login' && 'Ingresa tus credenciales para continuar'}
          {step === 'register' && 'Completa tus datos para registrarte'}
          {step === 'recover' && 'Elige cómo recibir tu código de recuperación'}
          {step === 'recoverOTP' && 'Ingresa el código y tu nueva contraseña'}
          {step === 'success' && 'Tu cuenta ha sido verificada correctamente'}
          {step === 'error' && 'No se pudo completar la acción'}
        </p>
      </div>

      {/* Content */}
      <div className="relative flex-1 px-6 pb-6">
        <AnimatePresence mode="wait">
          {/* LOGIN */}
          {step === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 30, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -30, rotateY: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Segmented Switch */}
              <div className="bg-slatey-100 rounded-2xl p-1.5 flex gap-1 mb-6">
                {(['patient', 'dentist'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setCopValidated(false); }}
                    className="relative flex-1 py-3 text-sm font-semibold rounded-xl transition-colors"
                  >
                    {role === r && (
                      <motion.div
                        layoutId="roleSwitch"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 ${role === r ? 'text-primary-600' : 'text-slatey-500'}`}>
                      {r === 'patient' ? 'Soy Paciente' : 'Soy Odontólogo'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <Input
                  label="Correo electrónico"
                  value={email}
                  onChange={setEmail}
                  placeholder="tucorreo@gmail.com"
                  type="email"
                  icon={<Mail className="w-5 h-5" />}
                />
                <div>
                  <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slatey-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 pl-11 pr-11 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slatey-400 hover:text-slatey-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary-500"
                    />
                    <span className="text-slatey-600">Recordarme</span>
                  </label>
                  <button
                    onClick={() => setStep('recover')}
                    className="text-primary-600 font-semibold hover:text-primary-700"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button fullWidth size="lg" loading={loading} onClick={handleLogin}>
                  Iniciar sesión
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-slatey-200" />
                  <span className="text-xs text-slatey-400 font-medium">o</span>
                  <div className="flex-1 h-px bg-slatey-200" />
                </div>

                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-slatey-200 bg-white hover:bg-slatey-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.2 2.53-2.56 3.13v2.6h4.14c2.42-2.23 3.06-5.53 3.06-8.74z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-4.14-3.2c-1.15.77-2.62 1.23-4.14 1.23-3.18 0-5.88-2.15-6.84-5.05H1.9v3.3C3.72 20.03 7.5 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.16 13.32c-.25-.77-.39-1.59-.39-2.42s.14-1.65.39-2.42V7.18H1.9C1.03 8.9.5 10.86.5 12.9s.53 4 1.4 5.72l3.26-2.5z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.5 1 3.72 3.97 1.9 7.82l3.26 2.5C6.12 7.53 8.82 5.38 12 5.38z"/>
                  </svg>
                  <span className="text-sm font-semibold text-slatey-700">Continuar con Google</span>
                </button>

                <p className="text-center text-sm text-slatey-500">
                  ¿No tienes cuenta?{' '}
                  <button onClick={() => setStep('register')} className="text-primary-600 font-bold hover:text-primary-700">
                    Regístrate
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* REGISTER */}
          {step === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 30, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -30, rotateY: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="bg-slatey-100 rounded-2xl p-1.5 flex gap-1 mb-6">
                {(['patient', 'dentist'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setCopValidated(false); }}
                    className="relative flex-1 py-3 text-sm font-semibold rounded-xl transition-colors"
                  >
                    {role === r && (
                      <motion.div
                        layoutId="roleSwitchReg"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 ${role === r ? 'text-primary-600' : 'text-slatey-500'}`}>
                      {r === 'patient' ? 'Soy Paciente' : 'Soy Odontólogo'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <Input
                  label="Correo electrónico"
                  value={email}
                  onChange={setEmail}
                  placeholder="tucorreo@gmail.com"
                  type="email"
                  icon={<Mail className="w-5 h-5" />}
                />
                <div>
                  <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slatey-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3.5 pl-11 pr-11 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slatey-400 hover:text-slatey-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Confirmar contraseña</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slatey-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className="w-full px-4 py-3.5 pl-11 pr-11 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slatey-400 hover:text-slatey-600"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <Input
                  label="Teléfono"
                  value={phone}
                  onChange={setPhone}
                  placeholder="999 888 777"
                  type="tel"
                  icon={<Phone className="w-5 h-5" />}
                />
                <div className="flex items-center gap-2 text-xs text-slatey-400 px-1">
                  <span className="font-semibold text-primary-600">+51</span> Perú
                </div>

                {role === 'dentist' && (
                  <>
                    <Input
                      label="N° Colegiatura COP"
                      value={cop}
                      onChange={setCop}
                      placeholder="34512"
                      maxLength={6}
                      icon={<BadgeCheck className="w-5 h-5" />}
                    />
                    <div className="mt-1 flex items-center gap-2">
                      {cop.length >= 5 ? (
                        copValidated ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5"
                          >
                            <BadgeCheck className="w-4 h-4 text-success-500" />
                            <span className="text-xs font-semibold text-success-600">Colegiatura verificada vía API del COP</span>
                          </motion.div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                            <span className="text-xs text-slatey-500">Validando en tiempo real...</span>
                          </div>
                        )
                      ) : (
                        <Badge variant="primary" size="sm">
                          <Shield className="w-3 h-3" />
                          Validación en tiempo real vía API del COP
                        </Badge>
                      )}
                    </div>
                    <Input
                      label="RUC"
                      value={ruc}
                      onChange={setRuc}
                      placeholder="20123456789"
                      maxLength={11}
                      icon={<CreditCard className="w-5 h-5" />}
                    />
                  </>
                )}

                <Button fullWidth size="lg" loading={loading} onClick={handleRegister}>
                  Crear cuenta
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </Button>

                <p className="text-center text-sm text-slatey-500">
                  ¿Ya tienes cuenta?{' '}
                  <button onClick={() => setStep('login')} className="text-primary-600 font-bold hover:text-primary-700">
                    Inicia sesión
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* RECOVER METHOD */}
          {step === 'recover' && (
            <motion.div
              key="recover"
              initial={{ opacity: 0, x: 30, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -30, rotateY: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="space-y-4">
                <p className="text-sm text-slatey-600 text-center mb-2">
                  Selecciona cómo quieres recibir tu código de recuperación:
                </p>

                <button
                  onClick={() => setRecoverMethod('email')}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${recoverMethod === 'email' ? 'border-primary-400 bg-primary-50/50' : 'border-slatey-200 bg-white'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${recoverMethod === 'email' ? 'bg-primary-500' : 'bg-slatey-100'}`}>
                    <Mail className={`w-6 h-6 ${recoverMethod === 'email' ? 'text-white' : 'text-slatey-500'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-slatey-900 text-sm">Por correo electrónico</p>
                    <p className="text-xs text-slatey-500">Recibirás un código de 6 dígitos en tu Gmail</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${recoverMethod === 'email' ? 'border-primary-500 bg-primary-500' : 'border-slatey-300'}`}>
                    {recoverMethod === 'email' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                <button
                  onClick={() => setRecoverMethod('phone')}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${recoverMethod === 'phone' ? 'border-primary-400 bg-primary-50/50' : 'border-slatey-200 bg-white'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${recoverMethod === 'phone' ? 'bg-primary-500' : 'bg-slatey-100'}`}>
                    <Smartphone className={`w-6 h-6 ${recoverMethod === 'phone' ? 'text-white' : 'text-slatey-500'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-slatey-900 text-sm">Por SMS</p>
                    <p className="text-xs text-slatey-500">Recibirás un código en tu teléfono</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${recoverMethod === 'phone' ? 'border-primary-500 bg-primary-500' : 'border-slatey-300'}`}>
                    {recoverMethod === 'phone' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {recoverMethod === 'email' ? (
                  <Input
                    label="Correo electrónico"
                    value={email}
                    onChange={setEmail}
                    placeholder="tucorreo@gmail.com"
                    type="email"
                    icon={<Mail className="w-5 h-5" />}
                  />
                ) : (
                  <Input
                    label="Teléfono"
                    value={phone}
                    onChange={setPhone}
                    placeholder="999 888 777"
                    type="tel"
                    icon={<Phone className="w-5 h-5" />}
                  />
                )}

                <Button fullWidth size="lg" loading={loading} onClick={handleRecoverSend}>
                  Enviar código
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </Button>

                <button onClick={goBack} className="w-full text-sm text-slatey-500 hover:text-slatey-700 font-medium">
                  Volver a iniciar sesión
                </button>
              </div>
            </motion.div>
          )}

          {/* RECOVER OTP */}
          {step === 'recoverOTP' && (
            <motion.div
              key="recoverOTP"
              initial={{ opacity: 0, x: 30, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -30, rotateY: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="space-y-5">
                <div className="flex justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center"
                  >
                    {recoverMethod === 'email' ? <Mail className="w-9 h-9 text-primary-500" /> : <Smartphone className="w-9 h-9 text-primary-500" />}
                  </motion.div>
                </div>

                <p className="text-center text-sm text-slatey-600">
                  Enviamos un código de 6 dígitos {recoverMethod === 'email' ? 'a tu correo' : 'a tu teléfono'}<br />
                  <span className="font-semibold text-slatey-900">
                    {recoverMethod === 'email' ? email || 'tucorreo@gmail.com' : `+51 ${phone || '999 888 777'}`}
                  </span>
                </p>

                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      maxLength={1}
                      className={`w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 transition-all focus:outline-none ${digit ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slatey-200 bg-slatey-50'} focus:border-primary-400 focus:bg-white`}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <span className="text-sm text-slatey-500">
                    Reenviar código en{' '}
                    <span className="font-bold text-accent-600">
                      {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}
                    </span>
                  </span>
                  {otpTimer === 0 && (
                    <button onClick={() => setOtpTimer(300)} className="ml-2 text-primary-600 font-semibold text-sm hover:underline">
                      Reenvar
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Nueva contraseña</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slatey-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3.5 pl-11 pr-11 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slatey-400 hover:text-slatey-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button fullWidth size="lg" loading={loading} disabled={!otpComplete || newPassword.length < 6} onClick={handleRecoverVerify}>
                  Verificar y cambiar contraseña
                </Button>

                <button onClick={goBack} className="w-full text-sm text-slatey-500 hover:text-slatey-700 font-medium">
                  Volver
                </button>
              </div>
            </motion.div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="relative w-28 h-28 mb-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 rounded-full bg-success-200"
                />
                <div className="relative w-28 h-28 rounded-full bg-success-50 flex items-center justify-center">
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-14 h-14 text-success-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                </div>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-bold text-slatey-900 font-display mb-2"
              >
                ¡Verificación completa!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-slatey-500 text-center mb-8 max-w-xs"
              >
                {role === 'patient'
                  ? 'Ya puedes buscar odontólogos y reservar citas en segundos.'
                  : 'Tu cuenta profesional ha sido activada. Bienvenido a OdontoSystem.'}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full"
              >
                <Button fullWidth size="lg" onClick={handleEnter}>
                  {role === 'patient' ? 'Explorar odontólogos' : 'Ir a mi panel'}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="relative w-28 h-28 mb-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-error-200"
                />
                <div className="relative w-28 h-28 rounded-full bg-error-50 flex items-center justify-center">
                  <XCircle className="w-14 h-14 text-error-500" />
                </div>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-slatey-900 font-display mb-2"
              >
                No se pudo completar
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-slatey-500 text-center mb-3 max-w-xs"
              >
                {errorMsg}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slatey-100 mb-6 max-w-xs"
              >
                <AlertCircle className="w-4 h-4 text-slatey-500 flex-shrink-0" />
                <p className="text-xs text-slatey-600">
                  Intenta con otro método de recuperación o verifica tus datos.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full space-y-3"
              >
                <Button fullWidth size="lg" onClick={goBack}>
                  <RotateCcw className="w-5 h-5" /> Volver a intentar
                </Button>
                <button
                  onClick={() => setStep('recover')}
                  className="w-full text-sm text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Recuperar por otro método
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative px-6 pb-8 pt-4 border-t border-slatey-100">
        <div className="flex items-center justify-center gap-2 text-xs text-slatey-400">
          <Lock className="w-3.5 h-3.5" />
          <span>Tus datos están protegidos bajo la Ley N.º 29733 — Ley de Protección de Datos Personales</span>
        </div>
      </div>
    </div>
  );
}
