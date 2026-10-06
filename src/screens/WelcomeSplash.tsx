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
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-32 h-32 rounded-[2rem] bg-white flex items-center justify-center shadow-lg shadow-primary-500/25 overflow-visible"
        >
          <img src="/System_(1).png" alt="OdontoSystem" className="w-28 h-28 object-contain rounded-2xl" />
        </motion.div>
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