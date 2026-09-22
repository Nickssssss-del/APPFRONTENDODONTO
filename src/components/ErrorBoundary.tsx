import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slatey-50 flex flex-col items-center justify-center py-12">
          <div className="relative w-28 h-28 mb-6">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute inset-0 rounded-full bg-error-200"
            />
            <div className="relative w-28 h-28 rounded-full bg-error-50 flex items-center justify-center">
              <AlertCircle className="w-14 h-14 text-error-500" />
            </div>
          </div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-bold text-slatey-900 font-display mb-2"
          >
            Algo salió mal. Por favor intenta de nuevo.
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-slatey-500 text-center mb-8 max-w-xs"
          >
            Por favor recarga la aplicación para continuar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <Button fullWidth size="lg" onClick={() => window.location.reload()}>
              Recargar
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}