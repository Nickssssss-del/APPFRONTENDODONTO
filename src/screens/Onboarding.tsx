import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, User, Stethoscope } from 'lucide-react';
import { useApp } from '../store';

export default function Onboarding() {
  const { setScreen, setUser } = useApp();
  const [role, setRole] = useState<'patient' | 'dentist'>('patient');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [copNumber, setCopNumber] = useState(''); // Estado para la colegiatura COP

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setUser({
      role,
      fullName: fullName || (role === 'patient' ? 'María González' : 'Dr. Carlos Mendoza'),
      email,
    });

    if (role === 'patient') {
      setScreen('patientDashboard');
    } else {
      setScreen('dentistPanel');
    }
  };

  return (
    <div className="min-h-screen bg-slatey-50 flex flex-col justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-64 bg-gradient-to-b from-primary-50 to-transparent -z-10" />

      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Header App Brand */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ y: [0, -3, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-primary-500/20 overflow-hidden"
          >
            <img src="/System_(1).png" alt="OdontoSystem" className="w-11 h-11 object-contain" />
          </motion.div>
          <div>
            <h1 className="text-xl font-black text-slatey-900 font-display leading-tight">OdontoSystem</h1>
            <p className="text-xs text-slatey-500 font-medium">Tu sonrisa, en buenas manos</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl p-6 border border-slatey-100 shadow-xl shadow-slatey-200/50 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slatey-900 font-display">
              {isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
            </h2>
            <p className="text-xs text-slatey-500 mt-1">
              {isRegister
                ? 'Regístrate para reservar o gestionar consultas'
                : 'Ingresa tus credenciales para continuar'}
            </p>
          </div>

          {/* Selector de Rol */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slatey-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                role === 'patient'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slatey-600 hover:text-slatey-900'
              }`}
            >
              <User className="w-4 h-4" />
              Soy Paciente
            </button>
            <button
              type="button"
              onClick={() => setRole('dentist')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                role === 'dentist'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slatey-600 hover:text-slatey-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Soy Odontólogo
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slatey-700 block">Nombre Completo</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. María González"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slatey-700 block">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slatey-700 block">Contraseña</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slatey-400 hover:text-slatey-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Campo N.º de Colegiatura COP (Solo cuando Soy Odontólogo está activo) */}
            {role === 'dentist' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <label className="text-xs font-bold text-slatey-700 block">N.º de Colegiatura COP</label>
                <div className="relative">
                  <Shield className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={copNumber}
                    onChange={(e) => setCopNumber(e.target.value)}
                    placeholder="COP-12345"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm uppercase"
                  />
                </div>
                <p className="text-[11px] text-slatey-500 font-medium">
                  Verificamos en tiempo real con el registro oficial COP.
                </p>
              </motion.div>
            )}

            {!isRegister && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slatey-600 font-medium">
                  <input type="checkbox" className="rounded border-slatey-300 text-primary-500 focus:ring-primary-400" />
                  Recordarme
                </label>
                <button type="button" className="text-primary-600 font-bold hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all mt-2"
            >
              {isRegister ? 'Registrarse' : 'Iniciar sesión'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social / Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slatey-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slatey-400">o</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-2xl bg-white border border-slatey-200 text-slatey-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slatey-50 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuar con Google
          </button>

          {/* Switch Register/Login */}
          <p className="text-center text-xs text-slatey-500 pt-2">
            {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary-600 font-bold hover:underline"
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}