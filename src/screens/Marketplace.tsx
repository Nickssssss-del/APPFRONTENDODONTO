import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, BadgeCheck, Clock, AlertCircle, ArrowRight, Calendar, Check,
  CreditCard, User as UserIcon, Loader2, ShieldCheck,
} from 'lucide-react';
import { useApp, TREATMENTS, formatTime, DNI_DATABASE } from '../store';
import { Button, Badge, Modal } from '../components/ui';

const CLINIC_IMAGES = [
  'https://images.pexels.com/photos/305567/pexels-photo-305567.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/6502543/pexels-photo-6502543.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/6809639/pexels-photo-6809639.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/4269268/pexels-photo-4269268.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/6809648/pexels-photo-6809648.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
];

const DOCTOR_AVATAR = 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200';
const COVER_IMAGE = 'https://images.pexels.com/photos/38055773/pexels-photo-38055773.jpeg?auto=compress&cs=tinysrgb&h=400&w=900';

const DAYS = ['Lun 15', 'Mar 16', 'Mié 17', 'Jue 18', 'Vie 19', 'Sáb 20'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export default function Marketplace() {
  const { setScreen, selectedTreatment, setSelectedTreatment, startHold, isHoldActive, holdSeconds, user, setUser } = useApp();
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [showDniModal, setShowDniModal] = useState(false);
  const [dniInput, setDniInput] = useState('');
  const [dniVerifying, setDniVerifying] = useState(false);
  const [dniVerified, setDniVerified] = useState(false);
  const [dniName, setDniName] = useState('');
  const [dniError, setDniError] = useState(false);

  const handleReserveClick = () => {
    if (!selectedTime) return;
    setShowDniModal(true);
  };

  const handleDniVerify = () => {
    setDniVerifying(true);
    setDniError(false);
    setTimeout(() => {
      const data = DNI_DATABASE[dniInput];
      if (data) {
        setDniVerifying(false);
        setDniVerified(true);
        setDniName(data.name);
        setUser({ ...user, fullName: data.name, dni: dniInput, age: data.age });
      } else {
        setDniVerifying(false);
        setDniError(true);
      }
    }, 1500);
  };

  const handleConfirmReservation = () => {
    setShowDniModal(false);
    startHold(600);
    setScreen('checkout');
  };

  const resetDniModal = () => {
    setShowDniModal(false);
    setDniInput('');
    setDniVerifying(false);
    setDniVerified(false);
    setDniName('');
    setDniError(false);
  };

  return (
    <div className="min-h-screen bg-slatey-50 pb-32">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden">
        <img src={COVER_IMAGE} alt="Consultorio" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slatey-900/70 via-slatey-900/20 to-transparent" />
        <button
          onClick={() => setScreen('onboarding')}
          className="absolute top-4 left-4 p-2.5 rounded-xl glass text-white hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="absolute top-4 right-4 p-2.5 rounded-xl glass text-white hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Doctor Info */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl shadow-lg shadow-slatey-900/5 p-5">
          <div className="flex items-start gap-4">
            <img
              src={DOCTOR_AVATAR}
              alt="Dr. Carlos Mendoza"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md -mt-8"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slatey-900 font-display">Dr. Carlos Mendoza</h2>
              <p className="text-sm text-slatey-500">Odontólogo General · Lima</p>
              <p className="text-xs text-slatey-600 mt-2 leading-relaxed italic">
                "Apasionado por crear sonrisas saludables. Más de 10 años de experiencia en odontología general y estética dental."
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="success" size="sm">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  COP 34512 Verificado
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent-400 text-accent-400" />
                  <span className="text-sm font-bold text-slatey-900">4.9</span>
                  <span className="text-xs text-slatey-400">(127 reseñas)</span>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-50 text-primary-600 text-sm font-semibold hover:bg-primary-100 transition-colors">
            <MapPin className="w-4 h-4" />
            Ver en Maps
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-slatey-900 mb-3 px-1">Galería del establecimiento</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {CLINIC_IMAGES.map((img, i) => (
            <button
              key={i}
              onClick={() => setGalleryIdx(i)}
              className="flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden border-2 transition-all"
              style={{ borderColor: galleryIdx === i ? '#0D9488' : 'transparent' }}
            >
              <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Treatments */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-slatey-900 mb-3 px-1">Selecciona el tratamiento</h3>
        <div className="space-y-3">
          {TREATMENTS.map((t) => {
            const selected = selectedTreatment.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTreatment(t)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${selected ? 'border-primary-400 bg-primary-50/50' : 'border-slatey-200 bg-white hover:border-slatey-300'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-primary-500 bg-primary-500' : 'border-slatey-300'}`}>
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slatey-900">{t.name}</span>
                    <span className="font-bold text-primary-600 text-sm flex-shrink-0">S/ {t.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slatey-500 mt-0.5">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl shadow-slatey-900/10 border-t border-slatey-100">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-slatey-200" />
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slatey-400" />
              <span className="text-xs font-semibold text-slatey-500 uppercase tracking-wide">Selecciona día y hora</span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${selectedDay === day ? 'border-primary-400 bg-primary-500 text-white' : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'}`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              {TIME_SLOTS.map((slot) => {
                const selected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${selected ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'}`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {isHoldActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent-50 border border-accent-200"
              >
                <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-accent-700">
                  Horario bloqueado por {formatTime(holdSeconds)} min
                </span>
              </motion.div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-slatey-500">Garantía de reserva</p>
                <p className="text-lg font-bold text-slatey-900">S/ 20.00</p>
              </div>
              <Button
                size="lg"
                disabled={!selectedTime}
                onClick={handleReserveClick}
                className="flex-1"
              >
                Reservar Cita
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-slatey-400 text-center mt-2">
              Garantía S/ 20.00 · 100% reembolsable con 24h de anticipación
            </p>
          </div>
        </div>
      </div>

      {/* DNI Verification Modal */}
      <Modal open={showDniModal} onClose={resetDniModal} title="Verificar identidad">
        <AnimatePresence mode="wait">
          {!dniVerified ? (
            <motion.div
              key="dni-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary-50 border border-primary-100">
                <ShieldCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary-800 leading-relaxed">
                  Para confirmar tu reserva, ingresa tu DNI. El doctor podrá verificar tu identidad al llegar a la cita.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Número de DNI</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slatey-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dniInput}
                    onChange={(e) => {
                      setDniInput(e.target.value.replace(/\D/g, '').slice(0, 8));
                      setDniError(false);
                    }}
                    placeholder="12345678"
                    maxLength={8}
                    className={`w-full px-4 py-3.5 pl-11 rounded-2xl border-2 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:outline-none transition-all ${dniError ? 'border-error-400 bg-error-50' : 'border-slatey-200 focus:border-primary-400 focus:bg-white'}`}
                  />
                </div>
                {dniError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-error-600 mt-1.5 font-semibold"
                  >
                    DNI no encontrado. Verifica el número e intenta nuevamente.
                  </motion.p>
                )}
                <p className="text-xs text-slatey-400 mt-1.5">Prueba con: 12345678, 87654321, 23456789</p>
              </div>

              <Button
                fullWidth
                size="lg"
                loading={dniVerifying}
                disabled={dniInput.length < 8}
                onClick={handleDniVerify}
              >
                Verificar DNI
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="dni-verified"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-4">
                  <Check className="w-9 h-9 text-success-500" />
                </div>
                <h3 className="text-lg font-bold text-slatey-900 font-display mb-1">Identidad verificada</h3>
                <p className="text-sm text-slatey-500 text-center">Tu nombre ha sido confirmado y actualizado en tu perfil.</p>
              </motion.div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slatey-50 border border-slatey-100">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slatey-900 text-sm">{dniName}</p>
                  <p className="text-xs text-slatey-500">DNI: {dniInput} · {user.age || '28'} años</p>
                </div>
                <Badge variant="success" size="sm">
                  <Check className="w-3 h-3" /> Verificado
                </Badge>
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary-50 border border-primary-100">
                <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-xs text-primary-700">
                  Cita: {selectedDay}, {selectedTime} · {selectedTreatment.name}
                </span>
              </div>

              <Button fullWidth size="lg" onClick={handleConfirmReservation}>
                Confirmar y continuar al pago
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </div>
  );
}
