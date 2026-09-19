import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui';

interface WelcomeSplashProps {
  onFinish: () => void;
}

export default function WelcomeSplash({ onFinish }: WelcomeSplashProps) {
  const { user } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const fullName = user.fullName || 'Paciente';

  return (
    <div className="flex flex-col items-center text-center px-6">
      {/* Avatar / ilustración de bienvenida */}
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-primary-200"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute inset-0 rounded-full bg-success-200"
        />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-success-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" opacity="0.25"/>
            <path d="M12 6c-2 0-3 1-3 3 0 2 1 4 1 6 0 1 .5 2 2 2s2-1 2-2c0-2 1-4 1-6 0-2-1-3-3-3z"/>
          </svg>
        </div>
        {/* Pequeño icono de verificación en la esquina */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success-500 flex items-center justify-center border-2 border-white shadow-md"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
        </motion.div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-2xl font-extrabold text-slatey-900 font-display mb-1"
      >
        Bienvenido, {fullName}!
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-sm text-slatey-500 text-center mb-8 max-w-xs"
      >
        Tu cuenta ha sido verificada correctamente. Tu sonrisa, en buenas manos.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="w-full"
      >
        <Button fullWidth size="lg" onClick={() => onFinish()}>
          Continuar
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-xs text-slatey-400 mt-4"
      >
        Redirigiendo automáticamente...
      </motion.p>
    </div>
  );
}