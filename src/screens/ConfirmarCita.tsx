import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { useApp } from '@/store';
import { Button, Badge } from '@/components/ui';

export default function ConfirmarCita() {
  const {
    selectedTreatment,
    selectedDay,
    selectedTime,
    user,
    setScreen,
  } = useApp();
  const [confirming, setConfirming] = useState(false);

  const handleBack = () => {
    // Go back to marketplace to change date/time
    // Note: This will preserve the selected treatment but allow changing day/time
    setScreen('marketplace');
  };

  const handleConfirm = () => {
    setConfirming(true);
    // Simulate processing time
    setTimeout(() => {
      // Start the hold timer and go to checkout
      // In a real app, we might do some validation here first
      // For now, we'll just proceed to checkout
      // Note: The hold timer is started in Checkout screen or we could start it here
      setScreen('checkout');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slatey-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-slatey-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-xl hover:bg-slatey-100">
              <ArrowLeft className="w-5 h-5 text-slatey-700" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slatey-900 font-display">Confirmar Cita</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Appointment Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slatey-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slatey-900 text-sm">{selectedTreatment.name}</h3>
              <p className="text-sm font-semibold text-slatey-600">
                Dr. Carlos Mendoza · {selectedDay}, {selectedTime}
              </p>
              <p className="text-xs text-slatey-500">
                Duración: 60 min · Tarifa: S/ {selectedTreatment.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Warning/Notice Banner */}
        <div className="bg-accent-50 border border-accent-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-600" />
            <div>
              <p className="font-bold text-accent-800">
                Información importante
              </p>
              <p className="text-sm text-accent-700">
                Recuerda que puedes cancelar tu cita hasta 12 horas antes sin penalidad. 
                Si faltas sin cancelar, se registrará un strike en tu cuenta.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Buttons */}
        <div className="space-y-4">
          <Button 
            fullWidth 
            onClick={handleConfirm} 
            className={`${confirming ? 'bg-primary-600' : 'bg-primary-50'} hover:bg-primary-100`}
          >
            {confirming ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-4 h-4 rounded-full bg-primary-300 animate-spin"
                />
                Confirmando...
              </>
            ) : (
              <>
                Continuar al pago
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
          
          <Button 
            fullWidth 
            variant="outline" 
            onClick={handleBack} 
            className="text-primary-600 hover:text-primary-700"
          >
            Volver y cambiar fecha/hora
            <ArrowRight className="w-4 h-4" rotate={180} />
          </Button>
        </div>
      </div>
    </div>
  );
}