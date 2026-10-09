import { motion } from 'framer-motion';
import { useApp } from '@/store';
import { useEffect } from 'react';
import { hasSeenTutorial } from './WelcomeTutorial';

export default function SplashScreen() {
  const { setScreen, splashComplete, setSplashComplete } = useApp();

  // Primer uso -> tutorial; usuarios recurrentes -> directo al login.
  const goNext = () => {
    setSplashComplete(true);
    setScreen(hasSeenTutorial() ? 'onboarding' : 'tutorial');
  };

  useEffect(() => {
    if (splashComplete) return;
    const timer = setTimeout(goNext, 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splashComplete]);

  return (
    <div
      onClick={goNext}
      role="button"
      aria-label="Continuar"
      className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-slatey-900 text-white flex flex-col items-center justify-center px-6 cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          className="relative w-32 h-32 rounded-[2rem] bg-white/95 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-900/25"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.22, 0, 0.22] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-3 rounded-[2.5rem] border border-success-300/60"
          />
          <motion.img
            src="/System_(3).png"
            alt="OdontoSystem"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-28 h-28 object-contain rounded-2xl"
          />
        </motion.div>

        {/* App Name & Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold font-display leading-tight mb-2">OdontoSystem</h1>
          <p className="text-primary-200 text-base leading-relaxed mb-8">Tu sonrisa, en buenas manos</p>
        </motion.div>

        {/* Main Slogan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-4"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
            La plataforma dental más completa del Perú
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-primary-200 text-sm leading-relaxed mb-10 max-w-xs mx-auto"
        >
          Reserva citas con odontólogos verificados, paga con Yape o Plin, y gestiona tu salud bucal en un solo lugar.
        </motion.p>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4 w-full max-w-xs mx-auto"
        >
          {[
            { title: 'Odontólogos verificados', desc: 'Validación en tiempo real vía API del COP' },
            { title: 'Pago seguro', desc: 'Yape, Plin y tarjetas con garantía reembolsable' },
            { title: 'Gobernanza de asistencia', desc: 'Sistema de strikes con apelación médica' },
            { title: 'OdontoBot 24/7', desc: 'Orientación dental al instante' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
              className="flex items-start gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-4 h-4 rounded-full bg-success-400" />
              </div>
              <div>
                <p className="font-semibold text-base">{item.title}</p>
                <p className="text-xs text-primary-200">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer legal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-12 pt-6 border-t border-white/10"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-primary-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Datos protegidos · Ley N.º 29733</span>
          </div>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="mt-8"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-primary-300">
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-white"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-white"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 rounded-full bg-white"
            />
            <span className="ml-3">Toca para continuar</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}