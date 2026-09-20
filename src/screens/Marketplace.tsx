import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, BadgeCheck, Clock, AlertCircle, ArrowRight, Calendar, Check,
  CreditCard, User as UserIcon, Loader2, ShieldCheck, Stethoscope,
} from 'lucide-react';
import { useApp, TREATMENTS, formatTime, DNI_DATABASE, DAY_LABELS, DENTIST_WORK_SCHEDULE } from '../store';
import { Button, Badge, Modal } from '../components/ui';
import type { DentistLocation } from '@/types';

const DENTISTS: DentistLocation[] = [
  {
    id: '1',
    name: 'Dr. Carlos Mendoza',
    specialty: 'Odontólogo General',
    rating: 4.9,
    reviews: 127,
    cop: 'COP 34512',
    address: 'Av. Javier Prado 1234, San Isidro',
    lat: 40,
    lng: 25,
    image: 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    price: 80,
  },
  {
    id: '2',
    name: 'Dra. Patricia Ruiz',
    specialty: 'Ortodoncista',
    rating: 4.8,
    reviews: 89,
    cop: 'COP 28765',
    address: 'Av. Arequipa 2345, Lince',
    lat: 65,
    lng: 55,
    image: 'https://images.pexels.com/photos/6812464/pexels-photo-6812464.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    price: 120,
  },
  {
    id: '3',
    name: 'Dr. Miguel Torres',
    specialty: 'Endodoncista',
    rating: 4.7,
    reviews: 64,
    cop: 'COP 45123',
    address: 'Av. Brasil 5678, Jesús María',
    lat: 25,
    lng: 65,
    image: 'https://images.pexels.com/photos/37458054/pexels-photo-37458054.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    price: 90,
  },
  {
    id: '4',
    name: 'Dra. Lucía Vargas',
    specialty: 'Odontopediatra',
    rating: 5.0,
    reviews: 152,
    cop: 'COP 31234',
    address: 'Av. La Marina 3456, San Miguel',
    lat: 75,
    lng: 30,
    image: 'https://images.pexels.com/photos/32205053/pexels-photo-32205053.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    price: 70,
  },
];

const CLINIC_IMAGES = [
  'https://images.pexels.com/photos/305567/pexels-photo-305567.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/6502543/pexels-photo-6502543.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/6809639/pexels-photo-6809639.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/4269268/pexels-photo-4269268.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/6809648/pexels-photo-6809648.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
];

const DOCTOR_AVATAR = 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200';
const COVER_IMAGE = 'https://images.pexels.com/photos/38055773/pexels-photo-38055773.jpeg?auto=compress&cs=tinysrgb&h=400&w=900';

const DAY_DATE_MAP: Record<string, string> = {
  'Lun': 'Lun 15',
  'Mar': 'Mar 16',
  'Mié': 'Mié 17',
  'Jue': 'Jue 18',
  'Vie': 'Vie 19',
  'Sáb': 'Sáb 20',
};

export default function Marketplace() {
  const { role, setScreen, selectedTreatment, setSelectedTreatment, startHold, isHoldActive, holdSeconds, user, setUser, selectedDentistId, setSelectedDentistId, isDayAvailable, getAvailableTimeSlots, selectedDay, setSelectedDay, selectedTime, setSelectedTime, agendaLocked, reschedulingRequestId, appointmentRequests } = useApp();
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [showDniModal, setShowDniModal] = useState(false);
  const [dniInput, setDniInput] = useState('');
  const [dniVerifying, setDniVerifying] = useState(false);
  const [dniVerified, setDniVerified] = useState(false);
  const [dniName, setDniName] = useState('');
const [dniError, setDniError] = useState(false);

  const currentDentistId = selectedDentistId || '1';
  const selectedDentist = DENTISTS.find((d) => d.id === currentDentistId) || DENTISTS[0];
  const isDentistUnavailable = selectedDentist.id === '1' && agendaLocked;
  const reschedulingRequest = appointmentRequests.find((request) => request.id === reschedulingRequestId);

  const handleSelectDentist = (id: string) => {
    setSelectedDentistId(id);
    setSelectedDay('Lun 15');
    setSelectedTime(null);
  };

  useEffect(() => {
    if (reschedulingRequest && selectedDay === 'Lun 15') {
      setSelectedDay(reschedulingRequest.selectedDay);
    }
  }, [reschedulingRequest, selectedDay, setSelectedDay]);
  const currentDayLabel = selectedDay ? DAY_LABELS.find((d) => DAY_DATE_MAP[d] === selectedDay) || DAY_LABELS[0] : DAY_LABELS[0];
  const isCurrentDayAvailable = isDayAvailable(currentDentistId, currentDayLabel);
  const availableTimeSlots = isCurrentDayAvailable
    ? getAvailableTimeSlots(currentDentistId, currentDayLabel, selectedTreatment.duration)
    : [];

  const handleDaySelect = (dayLabel: string) => {
    if (!isDayAvailable(currentDentistId, dayLabel)) return;
    setSelectedDay(DAY_DATE_MAP[dayLabel]);
    setSelectedTime(null);
  };

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
    setScreen('confirmarCita');
  };

  const resetDniModal = () => {
    setShowDniModal(false);
    setDniInput('');
    setDniVerifying(false);
    setDniVerified(false);
    setDniName('');
    setDniError(false);
  };

  if (!selectedDentistId) {
    return (
      <div className="min-h-screen bg-slatey-50 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-30 glass border-b border-slatey-100">
          <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen(role === 'patient' ? 'patientDashboard' : 'dentistPanel')}
                className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-bold text-slatey-900 font-display">Dentistas disponibles</h2>
                <p className="text-xs text-slatey-500">Elige un odontólogo para reservar</p>
              </div>
            </div>
            <Badge variant="primary" size="sm">{DENTISTS.length} disponibles</Badge>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-5 space-y-3">
          {DENTISTS.map((dentist, i) => (
            <motion.button
              key={dentist.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => handleSelectDentist(dentist.id)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-slatey-100 hover:border-primary-200 hover:shadow-md transition-all text-left"
            >
              <img src={dentist.image} alt={dentist.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-slatey-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slatey-900 font-display">{dentist.name}</h3>
                <p className="text-xs text-slatey-500 mt-0.5">{dentist.specialty}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-accent-400 text-accent-400" />
                    <span className="text-xs font-bold text-slatey-900">{dentist.rating}</span>
                    <span className="text-xs text-slatey-400">({dentist.reviews})</span>
                  </div>
                  <span className="text-xs text-slatey-300">·</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slatey-400" />
                    <span className="text-xs text-slatey-500 truncate">{dentist.address.split(',')[1]?.trim() || dentist.address}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-primary-600">S/ {dentist.price}</span>
                <span className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${dentist.id === '1' && agendaLocked ? 'bg-slatey-200 text-slatey-500' : 'bg-primary-500 text-white'}`}>
                  {dentist.id === '1' && agendaLocked ? 'No disponible temporalmente' : 'Reservar'}
                  {!(dentist.id === '1' && agendaLocked) && <ArrowRight className="w-3 h-3" />}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-slatey-50 pb-24">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden">
        <img src={COVER_IMAGE} alt="Consultorio" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slatey-900/70 via-slatey-900/20 to-transparent" />
        <button
          onClick={() => setSelectedDentistId(null)}
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
              src={selectedDentist.image}
              alt={selectedDentist.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md -mt-8"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slatey-900 font-display">{selectedDentist.name}</h2>
              <p className="text-sm text-slatey-500">{selectedDentist.specialty} · Lima</p>
              <p className="text-xs text-slatey-600 mt-2 leading-relaxed italic">
                "Apasionado por crear sonrisas saludables. Más de 10 años de experiencia en odontología general y estética dental."
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="success" size="sm">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {selectedDentist.cop} Verificado
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent-400 text-accent-400" />
                  <span className="text-sm font-bold text-slatey-900">{selectedDentist.rating}</span>
                  <span className="text-xs text-slatey-400">({selectedDentist.reviews} reseñas)</span>
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
      </div>

      {/* Booking Sheet */}
      <div className="shrink-0 flex flex-col max-h-[42vh] bg-white rounded-t-3xl shadow-2xl shadow-slatey-900/10 border-t border-slatey-100 overflow-hidden">
          <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-slatey-200" aria-hidden="true" />
          </div>

          <div className="px-5 min-h-0 overflow-y-auto scrollbar-hide">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-slatey-400" />
                    <span className="text-xs font-semibold text-slatey-500 uppercase tracking-wide">Selecciona día y hora</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {DAY_LABELS.map((dayLabel) => {
                      const day = DAY_DATE_MAP[dayLabel];
                      const available = isDayAvailable(currentDentistId, dayLabel);
                      const isSelected = selectedDay === day;
                      return (
                        <button
                          key={day}
                          onClick={() => handleDaySelect(dayLabel)}
                          disabled={!available}
                          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${isSelected ? 'border-primary-400 bg-primary-500 text-white' : available ? 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300' : 'border-slatey-200 bg-slatey-100 text-slatey-400 cursor-not-allowed'}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {!isCurrentDayAvailable ? (
                    <div className="mt-3 flex items-center gap-3 p-4 rounded-xl bg-accent-50 border border-accent-200">
                      <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0" />
                      <p className="text-sm text-accent-700">El odontólogo no atiende este día</p>
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="mt-3 text-center py-4">
                      <p className="text-sm text-slatey-500">No hay horarios disponibles para este día</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {availableTimeSlots.map((slot) => {
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
                  )}

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

            </div>

            <div className="flex-shrink-0 border-t border-slatey-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-slatey-500">Garantía de reserva</p>
                  <p className="text-lg font-bold text-slatey-900">S/ 20.00</p>
                </div>
                <Button
                  size="lg"
                  disabled={!selectedTime || isDentistUnavailable}
                  onClick={handleReserveClick}
                  className="flex-1"
                >
                  {isDentistUnavailable ? 'No disponible temporalmente' : 'Reservar Cita'}
                  {!isDentistUnavailable && <ArrowRight className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-xs text-slatey-400 text-center mt-2">
                Garantía S/ 20.00 · 100% reembolsable con 24h de anticipación
              </p>
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

