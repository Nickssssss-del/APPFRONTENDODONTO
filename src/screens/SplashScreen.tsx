import { motion } from 'framer-motion';
import { useApp } from '@/store';
import { useEffect } from 'react';

export default function SplashScreen() {
  const { setScreen, splashComplete, setSplashComplete } = useApp();

  useEffect(() => {
    if (splashComplete) return;
    const timer = setTimeout(() => {
      setSplashComplete(true);
      setScreen('onboarding');
    }, 10000);
    return () => clearTimeout(timer);
  }, [splashComplete, setScreen, setSplashComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-slatey-900 text-white flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" opacity="0.3"/>
            <path d="M12 6c-2 0-3 1-3 3 0 2 1 4 1 6 0 1 .5 2 2 2s2-1 2-2c0-2 1-4 1-6 0-2-1-3-3-3z"/>
          </svg>
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
            <span className="ml-3">Cargando...</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}