import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, MapPin, Star, Lock, FileText, AlertCircle, MessageCircle,
  Settings, Calendar, Upload, ArrowRight, CheckCircle2, Sofa,
  Navigation, X, BadgeCheck, Stethoscope, Phone, Maximize,
} from 'lucide-react';
import { useApp } from '../store';
import { Button, Badge, Modal } from '../components/ui';
import type { DentistLocation } from '../types';

const DENTIST_LOCATIONS: DentistLocation[] = [
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
    image: 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
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
    image: 'https://images.pexels.com/photos/6812464/pexels-photo-6812464.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
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
    image: 'https://images.pexels.com/photos/37458054/pexels-photo-37458054.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
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
    image: 'https://images.pexels.com/photos/32205053/pexels-photo-32205053.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    price: 70,
  },
];

export default function PatientDashboard() {
  const { setScreen, setSettingsOpen, attendanceStrikes, user, setSelectedDentistId, agendaLocked, appointmentRequests, setReschedulingRequestId } = useApp();
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<DentistLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const activeRequest = appointmentRequests[appointmentRequests.length - 1];

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Get dentists sorted by distance from user
  const getSortedDentistsByDistance = (): DentistLocation[] => {
    if (!userLocation) return DENTIST_LOCATIONS;
    
    return [...DENTIST_LOCATIONS].sort((a, b) => {
      const distA = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        a.lat, 
        a.lng
      );
      const distB = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        b.lat, 
        b.lng
      );
      return distA - distB;
    });
  };

  // Get distance for a specific dentist
  const getDistanceToDentist = (dentist: DentistLocation): number | null => {
    if (!userLocation) return null;
    return calculateDistance(
      userLocation.latitude, 
      userLocation.longitude, 
      dentist.lat, 
      dentist.lng
    );
  };

// Initialize geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("User denied the request for Geolocation");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("The request to get user location timed out");
            break;
          default:
            setLocationError("An unknown error occurred");
            break;
        }
        setLocationLoading(false);
      }
    );
  }, []);

  const handleAppeal = () => {
    setAppealSubmitted(true);
    setTimeout(() => {
      setShowAppealModal(false);
      setAppealSubmitted(false);
    }, 2000);
  };

  const renderMapBody = () => (
    <>
      {/* Map grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, #CBD5E1 1px, transparent 1px),
            linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Fake streets */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <path d="M 0 120 Q 50 100 100 110 T 200 120 T 300 115" stroke="#94A3B8" strokeWidth="3" fill="none" opacity="0.4" />
        <path d="M 0 180 Q 80 160 160 170 T 320 165" stroke="#94A3B8" strokeWidth="3" fill="none" opacity="0.4" />
        <path d="M 60 0 Q 50 80 70 160 T 90 280" stroke="#94A3B8" strokeWidth="3" fill="none" opacity="0.4" />
        <path d="M 180 0 Q 170 100 190 200 T 210 280" stroke="#94A3B8" strokeWidth="3" fill="none" opacity="0.4" />
      </svg>

      {/* Location pins */}
      {getSortedDentistsByDistance().map((loc) => {
        const distance = getDistanceToDentist(loc);
        return (
          <button
            key={loc.id}
            onClick={() => setSelectedDentist(loc)}
            className="absolute z-10 group"
            style={{ left: `${loc.lng}%`, top: `${loc.lat}%`, transform: 'translate(-50%, -100%)' }}
          >
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: Number(loc.id) * 0.1 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: Number(loc.id) * 0.3 }}
                className="w-10 h-10 rounded-full bg-primary-500 border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Stethoscope className="w-5 h-5 text-white" />
              </motion.div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary-500" />
              {/* Pulse ring */}
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: Number(loc.id) * 0.3 }}
                className="absolute inset-0 rounded-full bg-primary-400"
              />
            </motion.div>

            {/* Distance badge */}
            {distance !== null && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-primary-600/90 text-white text-xs font-medium px-2 py-0.5 rounded">
                {distance.toFixed(1)} km
              </div>
            )}
          </button>
        );
      })}

      {/* User location */}
      <div className="absolute z-5" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
        <motion.div
          animate={{ scale: [1, 3], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-blue-400"
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slatey-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-slatey-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <div>
            <p className="text-xs text-slatey-500">Hola,</p>
            <h2 className="text-lg font-bold text-slatey-900 font-display">{user.fullName || 'María González'}</h2>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors"
          >
            <Settings className="w-5 h-5 text-primary-600" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Today's Appointment */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-5 text-white shadow-lg shadow-primary-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary-100" />
            <span className="text-xs font-semibold text-primary-100 uppercase tracking-wide">{activeRequest ? 'Solicitud de cita' : 'Cita hoy'}</span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-extrabold font-display">{activeRequest?.selectedTime || '10:00'}{activeRequest ? '' : ' AM'}</span>
              </div>
              <p className="text-sm text-primary-100">Dr. Carlos Mendoza</p>
              <p className="text-xs text-primary-200 mt-0.5">{activeRequest?.treatment.name || 'Limpieza Dental Profunda'}</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              {activeRequest?.status === 'PENDING_APPROVAL' && <Clock className="w-3.5 h-3.5" />}
              {activeRequest?.status === 'RESCHEDULE_REQUESTED' && <AlertCircle className="w-3.5 h-3.5" />}
              {(!activeRequest || activeRequest.status === 'CONFIRMED') && <CheckCircle2 className="w-3.5 h-3.5" />}
              {!activeRequest ? 'Confirmada' : activeRequest.status === 'PENDING_APPROVAL' ? 'Pendiente de aprobación' : activeRequest.status === 'RESCHEDULE_REQUESTED' ? 'Reprogramación solicitada' : 'Confirmada'}
            </Badge>
          </div>
          {activeRequest?.status === 'PENDING_APPROVAL' && (
            <p className="text-xs text-primary-100 mb-3">El odontólogo debe revisar y confirmar tu solicitud antes de que la cita quede reservada.</p>
          )}
          {activeRequest?.status === 'RESCHEDULE_REQUESTED' && (
            <div className="mb-3 rounded-xl bg-white/15 p-3">
              <p className="text-xs text-primary-100 mb-2">El odontólogo solicitó elegir otro horario entre los bloques disponibles.</p>
              <button
                onClick={() => { setReschedulingRequestId(activeRequest.id); setSelectedDentistId(activeRequest.dentistId); setScreen('marketplace'); }}
                className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-primary-600"
              >
                Elegir otro horario
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-semibold">
              <Navigation className="w-4 h-4" /> Cómo llegar
            </button>
            <button
              onClick={() => setWaitingRoom(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors text-sm font-semibold ${waitingRoom ? 'bg-white text-primary-600' : 'bg-white/15 hover:bg-white/25'}`}
            >
              <Sofa className="w-4 h-4" /> {waitingRoom ? 'En sala ✓' : 'Estoy en sala'}
            </button>
          </div>
        </motion.div>

        {/* Interactive Map */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-slatey-900">Dentistas cerca de ti</h3>
            <Badge variant="primary" size="sm">{DENTIST_LOCATIONS.length} disponibles</Badge>
          </div>
          <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slatey-200 bg-gradient-to-br from-primary-50 via-slatey-100 to-primary-50">
            {renderMapBody()}

            {/* Map controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              <button className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slatey-700 font-bold shadow-sm">+</button>
              <button className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slatey-700 font-bold shadow-sm">−</button>
            </div>

            {/* Expand button */}
            <button
              onClick={() => setMapExpanded(true)}
              className="absolute bottom-3 right-3 w-9 h-9 rounded-lg glass flex items-center justify-center text-slatey-700 shadow-sm hover:bg-white/40 transition-colors"
              aria-label="Expandir mapa"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slatey-400 mt-1.5 px-1">Toca un pin para ver la información del odontólogo</p>
        </div>

        {/* Reputation Widget */}
        <div className="bg-white rounded-2xl p-4 border border-slatey-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-success-50 flex items-center justify-center flex-shrink-0">
            <Star className="w-7 h-7 text-success-500 fill-success-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slatey-900">Mi Estado</p>
            <p className="text-xs text-slatey-500">
              <span className="font-bold text-success-600">{attendanceStrikes}/3</span> Inasistencias
            </p>
            <div className="flex gap-1 mt-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < attendanceStrikes ? 'bg-error-400' : 'bg-success-400'}`}
                />
              ))}
            </div>
          </div>
          <Badge variant="success" size="sm">
            <Star className="w-3 h-3" /> Paciente Puntual
          </Badge>
        </div>

        {/* Medical Record */}
        <div className="bg-white rounded-2xl p-4 border border-slatey-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slatey-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-slatey-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slatey-900 text-sm">Ficha Médica</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-xs text-slatey-500">Protegido con Biometría / Face ID</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Ver historial
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Appeal Banner */}
        <button
          onClick={() => setShowAppealModal(true)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-accent-50 border border-accent-200 text-left hover:bg-accent-100/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-accent-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-accent-900">¿Tuviste un imprevisto médico?</p>
            <p className="text-xs text-accent-700">Apelar inasistencia adjuntando descanso médico</p>
          </div>
          <ArrowRight className="w-5 h-5 text-accent-600 flex-shrink-0" />
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setSelectedDentistId(null); setScreen('marketplace'); }}
            className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white border border-slatey-100 hover:border-primary-200 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slatey-900">Nueva Cita</p>
              <p className="text-xs text-slatey-500">Reservar consulta</p>
            </div>
          </button>
          <button
            onClick={() => setScreen('chatbot')}
            className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white border border-slatey-100 hover:border-primary-200 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slatey-900">OdontoBot</p>
              <p className="text-xs text-slatey-500">Orientación dental</p>
            </div>
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setScreen('chatbot')}
        className="fixed bottom-6 right-4 z-30 w-14 h-14 rounded-full bg-primary-500 shadow-xl shadow-primary-500/30 flex items-center justify-center hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
          1
        </span>
      </button>

{/* Dentist Popup */}
       <Modal open={!!selectedDentist} onClose={() => setSelectedDentist(null)} className="!sm:max-w-sm">
         {selectedDentist && (
           <div className="space-y-4">
             <div className="flex items-start gap-3">
               <img
                 src={selectedDentist.image}
                 alt={selectedDentist.name}
                 className="w-16 h-16 rounded-2xl object-cover border-2 border-slatey-100"
               />
               <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-slatey-900 font-display">{selectedDentist.name}</h3>
                 <p className="text-sm text-slatey-500">{selectedDentist.specialty}</p>
                 <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                   <Badge variant="success" size="sm">
                     <BadgeCheck className="w-3.5 h-3.5" /> {selectedDentist.cop}
                   </Badge>
                   <div className="flex items-center gap-1">
                     <Star className="w-3.5 h-3.5 fill-accent-400 text-accent-400" />
                     <span className="text-xs font-bold text-slatey-900">{selectedDentist.rating}</span>
                     <span className="text-xs text-slatey-400">({selectedDentist.reviews})</span>
                   </div>
                 </div>
               </div>
             </div>

             <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-slatey-50">
               <MapPin className="w-4 h-4 text-slatey-500 flex-shrink-0 mt-0.5" />
               <p className="text-xs text-slatey-600">{selectedDentist.address}</p>
             </div>

             <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary-50 border border-primary-100">
               <span className="text-sm font-semibold text-slatey-700">Consulta desde</span>
               <span className="text-lg font-bold text-primary-600">S/ {selectedDentist.price}.00</span>
             </div>

             {/* Distance from user */}
             {userLocation !== null && (
               <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slatey-50 border border-slatey-200">
                 <span className="text-sm font-semibold text-slatey-700">Distancia</span>
                 <span className="text-lg font-bold text-primary-600">
                   {getDistanceToDentist(selectedDentist)?.toFixed(1)} km
                 </span>
               </div>
             )}

             <div className="flex gap-2">
               <Button variant="outline" fullWidth onClick={() => setSelectedDentist(null)}>
                 <Phone className="w-4 h-4" /> Llamar
               </Button>
               <Button fullWidth disabled={selectedDentist.id === '1' && agendaLocked} onClick={() => { setSelectedDentist(null); setSelectedDentistId(null); setScreen('marketplace'); }}>
                 {selectedDentist.id === '1' && agendaLocked ? 'No disponible temporalmente' : 'Reservar'}
                 {!(selectedDentist.id === '1' && agendaLocked) && <ArrowRight className="w-4 h-4" />}
               </Button>
               {/* Ver perfil button */}
               <Button fullWidth onClick={() => {
                 // Set the selected dentist ID and navigate to profile screen
                 if (selectedDentist) {
                   setSelectedDentistId(selectedDentist.id);
                   setScreen('dentistProfile');
                 }
               }}>
                 Ver perfil
                 <ArrowRight className="w-4 h-4" />
               </Button>
             </div>
           </div>
       )}
       </Modal>

      {/* Full-screen Map */}
      <AnimatePresence>
        {mapExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slatey-50"
          >
            <div className="relative w-full h-full">
              {renderMapBody()}

              {/* Close button */}
              <button
                onClick={() => setMapExpanded(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-xl glass flex items-center justify-center text-slatey-700 shadow-md hover:bg-white/40 transition-colors"
                aria-label="Cerrar mapa"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="absolute top-4 left-4 z-20 px-4 py-2 rounded-xl glass">
                <h3 className="text-sm font-bold text-slatey-900">Dentistas cerca de ti</h3>
                <p className="text-xs text-slatey-500">{DENTIST_LOCATIONS.length} disponibles</p>
              </div>

              {/* Map controls */}
              <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-1">
                <button className="w-10 h-10 rounded-lg glass flex items-center justify-center text-slatey-700 font-bold shadow-sm">+</button>
                <button className="w-10 h-10 rounded-lg glass flex items-center justify-center text-slatey-700 font-bold shadow-sm">−</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appeal Modal */}
      <Modal open={showAppealModal} onClose={() => setShowAppealModal(false)} title="Apelar Inasistencia">
        {appealSubmitted ? (
          <div className="flex flex-col items-center text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-4"
            >
              <CheckCircle2 className="w-9 h-9 text-success-500" />
            </motion.div>
            <h3 className="text-lg font-bold text-slatey-900 mb-1">Apelación enviada</h3>
            <p className="text-sm text-slatey-500">Tu solicitud será revisada en 24-48h.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-accent-50 border border-accent-200">
              <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent-800 leading-relaxed">
                Si tu inasistencia fue por un imprevisto médico, adjunta tu descanso médico para que el strike sea removido de tu récord.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slatey-700 mb-2">Motivo de la apelación</label>
              <textarea
                rows={3}
                placeholder="Describe brevemente lo que ocurrió..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-slatey-50 focus:border-primary-400 focus:bg-white focus:outline-none resize-none text-sm"
              />
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm font-medium">
              <Upload className="w-5 h-5" />
              Adjuntar descanso médico (PDF / foto)
            </button>
            <Button fullWidth size="lg" onClick={handleAppeal}>
              Enviar apelación
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
