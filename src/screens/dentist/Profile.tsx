import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, User, Mail, Phone, BadgeCheck, CreditCard,
  Clock, Plus, X, Check, Calendar, AlertTriangle,
  FileText, Upload, Shield, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Button, Input, Badge, Modal } from '@/components/ui';
import { useApp, TREATMENTS } from '@/store';
import { WEEK_SCHEDULE } from '@/lib/dentistData';
import type { AgendaPatient, DayLabel } from '@/types';
import SmartImage from '@/components/SmartImage';
import { ApiError } from '@/api/http';
import { agregarFotoConsultorio, eliminarFotoConsultorio, listarFotosConsultorio, subirFotoPerfil, validarImagen } from '@/api/archivos';

type FotoItem = { id: string; url: string; demo?: boolean };

const DEFAULT_PHOTO = 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200';

const DAY_SHORT_MAP: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
  Domingo: 'Dom',
};

const CLINIC_PHOTOS = [
  'https://images.pexels.com/photos/305567/pexels-photo-305567.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/6502543/pexels-photo-6502543.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/6809639/pexels-photo-6809639.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DAY_OPTIONS: { label: string; value: DayLabel }[] = [
  { label: 'Lunes', value: 'Lun' },
  { label: 'Martes', value: 'Mar' },
  { label: 'Miércoles', value: 'Mié' },
  { label: 'Jueves', value: 'Jue' },
  { label: 'Viernes', value: 'Vie' },
  { label: 'Sábado', value: 'Sáb' },
  { label: 'Domingo', value: 'Dom' },
];

const DEFAULT_SCHEDULE: Record<string, { active: boolean; start: string; end: string }> = {
  Lunes: { active: true, start: '09:00', end: '18:00' },
  Martes: { active: true, start: '09:00', end: '18:00' },
  Miércoles: { active: true, start: '09:00', end: '18:00' },
  Jueves: { active: true, start: '09:00', end: '18:00' },
  Viernes: { active: true, start: '09:00', end: '17:00' },
  Sábado: { active: false, start: '09:00', end: '13:00' },
  Domingo: { active: false, start: '09:00', end: '13:00' },
};

export default function Profile() {
  const { dentistWorkSchedules, setDentistWorkSchedules, getAvailableTimeSlots, dentistRescheduleAppointment, appointmentRequests } = useApp();
  const dentistId = '1'; // Dr. Carlos Mendoza is dentist 1
  const storeSchedule = dentistWorkSchedules[dentistId];

  const initialSchedule = {
    Lunes: { active: storeSchedule?.['Lun']?.active ?? true, start: storeSchedule?.['Lun']?.start ?? '08:00', end: storeSchedule?.['Lun']?.end ?? '17:00' },
    Martes: { active: storeSchedule?.['Mar']?.active ?? true, start: storeSchedule?.['Mar']?.start ?? '08:00', end: storeSchedule?.['Mar']?.end ?? '17:00' },
    Miércoles: { active: storeSchedule?.['Mié']?.active ?? true, start: storeSchedule?.['Mié']?.start ?? '08:00', end: storeSchedule?.['Mié']?.end ?? '17:00' },
    Jueves: { active: storeSchedule?.['Jue']?.active ?? true, start: storeSchedule?.['Jue']?.start ?? '08:00', end: storeSchedule?.['Jue']?.end ?? '17:00' },
    Viernes: { active: storeSchedule?.['Vie']?.active ?? true, start: storeSchedule?.['Vie']?.start ?? '08:00', end: storeSchedule?.['Vie']?.end ?? '17:00' },
    Sábado: { active: storeSchedule?.['Sáb']?.active ?? true, start: storeSchedule?.['Sáb']?.start ?? '09:00', end: storeSchedule?.['Sáb']?.end ?? '14:00' },
    Domingo: { active: storeSchedule?.['Dom']?.active ?? false, start: storeSchedule?.['Dom']?.start ?? '09:00', end: storeSchedule?.['Dom']?.end ?? '13:00' },
  };

  const [photo, setPhoto] = useState(DEFAULT_PHOTO);
  const [fullName, setFullName] = useState('Dr. Carlos Mendoza');
  const [specialty, setSpecialty] = useState('Odontólogo General');
  const [cop, setCop] = useState('34512');
  const [ruc, setRuc] = useState('20123456789');
  const [email, setEmail] = useState('dr.mendoza@odontosystem.pe');
  const [phone, setPhone] = useState('999 888 777');
  const [bio, setBio] = useState('Apasionado por crear sonrisas saludables. Más de 10 años de experiencia en odontología general y estética dental.');
  // Galería: arranca con fotos de ejemplo y se reemplaza por las REALES del backend (Cloudinary) al cargar.
  const [fotos, setFotos] = useState<FotoItem[]>(CLINIC_PHOTOS.map((url, i) => ({ id: `demo-${i}`, url, demo: true })));
  const [fotosEstado, setFotosEstado] = useState<'cargando' | 'servidor' | 'demo'>('cargando');
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const galeriaInput = useRef<HTMLInputElement>(null);
  const perfilInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelado = false;
    listarFotosConsultorio().then(
      (lista) => {
        if (cancelado) return;
        setFotos([...lista].sort((a, b) => a.orden - b.orden).map((f) => ({ id: f.id, url: f.url })));
        setFotosEstado('servidor');
      },
      () => !cancelado && setFotosEstado('demo'),
    );
    return () => {
      cancelado = true;
    };
  }, []);

  const agregarFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validarImagen(file);
    if (err) return setFotoError(err);
    if (fotosEstado !== 'servidor') return setFotoError('Sin conexión con el servidor: no se puede subir ahora.');
    setSubiendo(true);
    setFotoError(null);
    try {
      const nueva = await agregarFotoConsultorio(file);
      setFotos((prev) => [...prev, { id: nueva.id, url: nueva.url }]);
    } catch (error) {
      setFotoError(error instanceof ApiError ? error.message : 'No se pudo subir la foto.');
    } finally {
      setSubiendo(false);
    }
  };

  const quitarFoto = async (f: FotoItem) => {
    if (!f.demo) {
      try {
        await eliminarFotoConsultorio(f.id);
      } catch (error) {
        return setFotoError(error instanceof ApiError ? error.message : 'No se pudo eliminar la foto.');
      }
    }
    setFotos((prev) => prev.filter((x) => x.id !== f.id));
  };

  const cambiarFotoPerfil = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validarImagen(file);
    if (err) return setFotoError(err);
    try {
      const r = await subirFotoPerfil(file);
      setPhoto(r.fotoPerfilUrl);
      setFotoError(null);
    } catch (error) {
      setFotoError(error instanceof ApiError ? error.message : 'No se pudo cambiar la foto de perfil.');
    }
  };
  const [schedule, setSchedule] = useState<Record<string, { active: boolean; start: string; end: string }>>(initialSchedule);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Professional verification
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'observado' | 'rechazado'>('verified');
  const [docFiles, setDocFiles] = useState<{ dni?: File; title?: File; cop?: File; cv?: File }>({});

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningDaysList, setWarningDaysList] = useState<{ day: string; count: number; patients: AgendaPatient[] }[]>([]);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedReschedulePatient, setSelectedReschedulePatient] = useState<AgendaPatient | null>(null);
  const [rescheduledPatientIds, setRescheduledPatientIds] = useState<Set<string>>(new Set());
  const [rescheduleDay, setRescheduleDay] = useState<DayLabel>('Lun');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');

  const getTreatmentDuration = (treatmentName: string): number => {
    const treatment = TREATMENTS.find((t) => t.name === treatmentName);
    return treatment ? treatment.duration : 60;
  };

  const getDateStringForDay = (dayLabel: DayLabel): string => {
    const daySchedule = WEEK_SCHEDULE.find((d) => d.dayLabel === dayLabel);
    return daySchedule ? daySchedule.fullDate : dayLabel;
  };

   const handleRescheduleConfirm = () => {
     if (selectedReschedulePatient) {
       const matchingRequest = appointmentRequests.find(
         (req) => req.patientDni === selectedReschedulePatient.dni
       );
       if (matchingRequest) {
         dentistRescheduleAppointment(matchingRequest.id, rescheduleDay, getDateStringForDay(rescheduleDay), rescheduleTime);
       }
       setRescheduledPatientIds((prev) => new Set([...prev, selectedReschedulePatient.id]));
     }
     setRescheduleModalOpen(false);
     setSelectedReschedulePatient(null);
   };

  const checkScheduleWarnings = (newSchedule: typeof schedule) => {
    const warningDays: { day: string; count: number; patients: AgendaPatient[] }[] = [];
    Object.entries(newSchedule).forEach(([dayName, config]) => {
      if (!config.active) {
        const shortLabel = DAY_SHORT_MAP[dayName];
        const daySched = WEEK_SCHEDULE.find(s => s.dayLabel === shortLabel);
        if (daySched) {
          const pendingPatients = daySched.patients.filter((pat) => !rescheduledPatientIds.has(pat.id));
          if (pendingPatients.length > 0) {
            warningDays.push({
              day: dayName,
              count: pendingPatients.length,
              patients: pendingPatients
            });
          }
        }
      }
    });
    return warningDays;
  };

  const executeSave = (newSchedule: typeof schedule) => {
    setSaving(true);
    const updatedStoreSchedule: Record<string, { active: boolean; start: string; end: string }> = {};
    Object.entries(newSchedule).forEach(([dayName, config]) => {
      const shortLabel = DAY_SHORT_MAP[dayName];
      if (shortLabel) {
        updatedStoreSchedule[shortLabel] = {
          active: config.active,
          start: config.start,
          end: config.end
        };
      }
    });

    setDentistWorkSchedules({
      ...dentistWorkSchedules,
      [dentistId]: updatedStoreSchedule
    });

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1200);
  };

  const handleSave = () => {
    const warnings = checkScheduleWarnings(schedule);
    if (warnings.length > 0) {
      setWarningDaysList(warnings);
      setWarningModalOpen(true);
    } else {
      executeSave(schedule);
    }
  };

  const handleConfirmSaveWithWarnings = () => {
    setWarningModalOpen(false);
    executeSave(schedule);
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div className="space-y-5">
      {/* Photo Section */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-center gap-4">
          <div className="relative">
            <SmartImage src={photo} alt={fullName} ratio="1/1" fallback="avatar" gravity="face" widths={[160, 320]} sizes="80px" className="w-20 h-20 rounded-2xl" />
            <input ref={perfilInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={cambiarFotoPerfil} />
            <button onClick={() => perfilInput.current?.click()} aria-label="Cambiar foto de perfil" className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slatey-900">Foto de perfil</h3>
            <p className="text-xs text-slatey-500 mt-0.5">Toca el ícono para actualizar tu foto profesional</p>
            <Badge variant="success" size="sm" className="mt-2">
              <Check className="w-3 h-3" /> Verificado
            </Badge>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100 space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-bold text-slatey-900">Información profesional</h3>
        </div>
        <Input label="Nombre completo" value={fullName} onChange={setFullName} icon={<User className="w-5 h-5" />} />
        <Input label="Especialidad" value={specialty} onChange={setSpecialty} icon={<BadgeCheck className="w-5 h-5" />} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="N° COP" value={cop} onChange={setCop} icon={<BadgeCheck className="w-5 h-5" />} maxLength={6} />
          <Input label="RUC" value={ruc} onChange={setRuc} icon={<CreditCard className="w-5 h-5" />} maxLength={11} />
        </div>
        <Input label="Correo" value={email} onChange={setEmail} type="email" icon={<Mail className="w-5 h-5" />} />
        <Input label="Teléfono" value={phone} onChange={setPhone} type="tel" icon={<Phone className="w-5 h-5" />} />
        <div>
          <label className="block text-sm font-semibold text-slatey-700 mb-1.5">Descripción / Sobre mí</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="Escribe una breve biografía o frase llamativa para atraer pacientes nuevos..."
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none transition-all text-sm resize-none"
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-slatey-400">Visible en tu perfil público para pacientes</p>
            <span className={`text-xs font-semibold ${bio.length > 180 ? 'text-error-500' : 'text-slatey-400'}`}>{bio.length}/200</span>
          </div>
        </div>
      </div>

      {/* Professional Verification */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-slatey-900">Verificación profesional (COP)</h3>
          </div>
          <Badge
            variant={
              verificationStatus === 'verified' ? 'success' :
              verificationStatus === 'pending' ? 'warning' :
              'error'
            }
            size="sm"
          >
            {verificationStatus === 'verified' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {verificationStatus === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
            { (verificationStatus === 'observado' || verificationStatus === 'rechazado') && <AlertTriangle className="w-3 h-3 mr-1" />}
            {verificationStatus === 'verified' ? 'Verificado' :
             verificationStatus === 'pending' ? 'Pendiente' :
             verificationStatus === 'observado' ? 'Observado' : 'Rechazado'}
          </Badge>
        </div>

        {(verificationStatus === 'observado' || verificationStatus === 'rechazado') && (
          <div className="space-y-3">
            <p className="text-sm text-slatey-600">
              Tu documentación fue <strong>{verificationStatus === 'observado' ? 'observada' : 'rechazada'}</strong> por el sistema.
              Por favor vuelve a subir los documentos requeridos. No es necesario iniciar un nuevo trámite.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DocUpload label="DNI (frente y dorso)" icon={<FileText className="w-5 h-5" />} file={docFiles.dni} onChange={(f) => setDocFiles(prev => ({ ...prev, dni: f }))} />
              <DocUpload label="Título profesional" icon={<FileText className="w-5 h-5" />} file={docFiles.title} onChange={(f) => setDocFiles(prev => ({ ...prev, title: f }))} />
              <DocUpload label="Colegiatura (COP)" icon={<BadgeCheck className="w-5 h-5" />} file={docFiles.cop} onChange={(f) => setDocFiles(prev => ({ ...prev, cop: f }))} />
              <DocUpload label="Currículum Vitae (PDF)" icon={<FileText className="w-5 h-5" />} file={docFiles.cv} onChange={(f) => setDocFiles(prev => ({ ...prev, cv: f }))} />
            </div>
            <Button
              fullWidth
              variant="primary"
              onClick={() => {
                setVerificationStatus('pending');
                setTimeout(() => setVerificationStatus('verified'), 1500);
              }}
              disabled={!docFiles.dni || !docFiles.title || !docFiles.cop || !docFiles.cv}
            >
              <Upload className="w-4 h-4 mr-2" />
              Reenviar documentos para verificación
            </Button>
          </div>
        )}

        {verificationStatus === 'verified' && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-success-50 border border-success-100">
            <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
            <p className="text-xs text-success-800">Tu verificación está vigente. Todos los documentos aprobados.</p>
          </div>
        )}

        {verificationStatus === 'pending' && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warning-50 border border-warning-100">
            <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0" />
            <p className="text-xs text-warning-800">Verificación en revisión. Te notificaremos cuando concluya.</p>
          </div>
        )}
      </div>

      {/* Clinic Gallery */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-slatey-900">Galería del consultorio</h3>
          </div>
          <Badge variant="neutral" size="sm">{fotos.length} fotos</Badge>
        </div>
        {fotosEstado === 'demo' && (
          <p className="mb-2 text-[11px] text-warning-700">Mostrando fotos de ejemplo: no hay conexión con el servidor.</p>
        )}
        {fotoError && (
          <p role="alert" className="mb-2 text-xs font-medium text-error-600">{fotoError}</p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f, i) => (
            <div key={f.id} className="relative rounded-xl overflow-hidden border border-slatey-200 group">
              <SmartImage src={f.url} alt={`Consultorio ${i + 1}`} ratio="1/1" fallback="clinic" widths={[160, 320]} sizes="33vw" />
              <button
                onClick={() => quitarFoto(f)}
                aria-label={`Eliminar foto ${i + 1}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-error-500 text-white flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <input ref={galeriaInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={agregarFoto} />
          <button
            onClick={() => galeriaInput.current?.click()}
            disabled={subiendo || fotos.length >= 10}
            className="aspect-square rounded-xl border-2 border-dashed border-slatey-200 flex flex-col items-center justify-center text-slatey-400 hover:border-primary-300 hover:text-primary-500 transition-colors disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium mt-1">{subiendo ? 'Subiendo…' : 'Agregar'}</span>
          </button>
        </div>
      </div>

      {/* Work Schedule */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-bold text-slatey-900">Horarios de atención</h3>
        </div>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const config = schedule[day];
            return (
              <div
                key={day}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  config.active ? 'border-primary-200 bg-primary-50/30' : 'border-slatey-100 bg-slatey-50'
                }`}
              >
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors flex-shrink-0 ${
                    config.active ? 'bg-primary-500' : 'bg-slatey-300'
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`w-5 h-5 rounded-full bg-white shadow-md ${config.active ? 'ml-auto mr-0.5' : 'ml-0.5'}`}
                  />
                </button>
                <span className={`text-sm font-semibold w-20 ${config.active ? 'text-slatey-900' : 'text-slatey-400'}`}>
                  {day}
                </span>
                <AnimatePresence>
                  {config.active && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-2 flex-1 overflow-hidden"
                    >
                      <input
                        type="time"
                        value={config.start}
                        onChange={(e) => updateTime(day, 'start', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slatey-200 bg-white text-xs font-semibold text-slatey-700 focus:border-primary-400 focus:outline-none"
                      />
                      <span className="text-xs text-slatey-400">—</span>
                      <input
                        type="time"
                        value={config.end}
                        onChange={(e) => updateTime(day, 'end', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slatey-200 bg-white text-xs font-semibold text-slatey-700 focus:border-primary-400 focus:outline-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                {!config.active && (
                  <span className="text-xs text-slatey-400 ml-auto">No disponible</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="pb-4">
        <Button
          fullWidth
          size="lg"
          loading={saving}
          onClick={handleSave}
          variant={saved ? 'success' : 'primary'}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" /> Cambios guardados
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5" /> Guardar cambios
            </>
          )}
        </Button>
      </div>

      {/* Warning Modal */}
      <Modal open={warningModalOpen} onClose={() => setWarningModalOpen(false)} title="Advertencia de Citas">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-error-50 border border-error-100">
            <AlertTriangle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-error-800">Citas agendadas en días no disponibles</p>
              <p className="text-xs text-error-700 leading-relaxed mt-0.5">
                Has desactivado días que actualmente tienen citas agendadas. Debes reprogramarlas o notificar a los pacientes.
              </p>
            </div>
          </div>

           <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
             {warningDaysList.map((wd) => {
               const visiblePatients = wd.patients.filter((pat) => !rescheduledPatientIds.has(pat.id));
               if (visiblePatients.length === 0) return null;
               return (
                 <div key={wd.day} className="p-3 rounded-xl bg-slatey-50 border border-slatey-100 space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-slatey-900">{wd.day}</span>
                     <Badge variant="error" size="sm">
                       {visiblePatients.length} {visiblePatients.length === 1 ? 'cita agendada' : 'citas agendadas'}
                     </Badge>
                   </div>
                   <div className="space-y-1.5 pl-1">
                     {visiblePatients.map((pat) => (
                       <div key={pat.id} className="flex items-center justify-between text-xs text-slatey-600 bg-white p-2 rounded-lg border border-slatey-100">
                         <div>
                           <p className="font-semibold text-slatey-800">{pat.name}</p>
                           <p className="text-[10px] text-slatey-400">{pat.treatment}</p>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="font-bold text-slatey-700">{pat.time}</span>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setSelectedReschedulePatient(pat);
                               setRescheduleDay('Lun');
                               setRescheduleTime('');
                               setRescheduleModalOpen(true);
                             }}
                           >
                             Reprogramar
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               );
             })}
           </div>

           <div className="flex gap-3">
             <Button variant="outline" fullWidth onClick={() => setWarningModalOpen(false)}>
               Cancelar
             </Button>
             <Button variant="primary" fullWidth onClick={handleConfirmSaveWithWarnings}>
               Guardar de todas formas
             </Button>
           </div>
         </div>
       </Modal>

       {/* Reschedule Modal */}
       <Modal
         open={rescheduleModalOpen && !!selectedReschedulePatient}
         onClose={() => setRescheduleModalOpen(false)}
         title="Reprogramar cita"
       >
         {selectedReschedulePatient && (
           <div className="space-y-4">
             <div className="flex items-center gap-3 p-3 rounded-xl bg-slatey-50 border border-slatey-100">
               <img src={selectedReschedulePatient.photo} alt={selectedReschedulePatient.name} className="w-10 h-10 rounded-lg object-cover" />
               <div>
                 <p className="text-sm font-bold text-slatey-900">{selectedReschedulePatient.name}</p>
                 <p className="text-xs text-slatey-500">{selectedReschedulePatient.treatment} • {selectedReschedulePatient.time}</p>
               </div>
             </div>

             <div>
               <label className="block text-sm font-semibold text-slatey-700 mb-2">Seleccionar día</label>
               <select
                 value={rescheduleDay}
                 onChange={(e) => setRescheduleDay(e.target.value as DayLabel)}
                 className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 focus:border-primary-400 focus:outline-none text-sm font-medium"
               >
                 {DAY_OPTIONS.map((opt) => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                 ))}
               </select>
             </div>

             {getAvailableTimeSlots(dentistId, rescheduleDay, getTreatmentDuration(selectedReschedulePatient.treatment)).length === 0 ? (
               <p className="text-sm text-slatey-500">No hay horarios disponibles para este día.</p>
             ) : (
               <div>
                 <label className="block text-sm font-semibold text-slatey-700 mb-2">Seleccionar hora</label>
                 <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                   {getAvailableTimeSlots(dentistId, rescheduleDay, getTreatmentDuration(selectedReschedulePatient.treatment))
                     .filter((slot) => slot !== selectedReschedulePatient.time)
                     .map((slot) => (
                       <button
                         key={slot}
                         onClick={() => setRescheduleTime(slot)}
                         className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                           rescheduleTime === slot
                             ? 'bg-primary-500 text-white shadow-md'
                             : 'bg-white border border-slatey-200 text-slatey-700 hover:border-primary-300 hover:bg-primary-50'
                         }`}
                       >
                         {slot}
                       </button>
                     ))}
                 </div>
               </div>
             )}

             <div className="flex gap-3">
               <Button variant="outline" fullWidth onClick={() => setRescheduleModalOpen(false)}>
                 Cancelar
               </Button>
               <Button
                 fullWidth
                 disabled={!rescheduleTime}
                 onClick={handleRescheduleConfirm}
               >
                 Confirmar reprogramación
               </Button>
             </div>
           </div>
         )}
       </Modal>
</div>
    );
  }

function DocUpload({ label, icon, file, onChange }: { label: string; icon: React.ReactNode; file?: File; onChange: (f: File) => void }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl border-2 border-dashed border-slatey-200 hover:border-primary-300 transition-colors">
      <div className="flex items-center gap-2 text-sm font-semibold text-slatey-700">
        <span className="text-primary-500">{icon}</span>
        {label}
      </div>
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
        className="sr-only"
        id={`upload-${label.replace(/\s+/g, '-')}`}
      />
      <label
        htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
        className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slatey-50 text-sm text-slatey-600 hover:bg-slatey-100 cursor-pointer transition-colors"
      >
        <Upload className="w-4 h-4" />
        {file ? `Seleccionado: ${file.name}` : 'Seleccionar archivo'}
      </label>
      {file && (
        <p className="text-[10px] text-success-600 flex items-center gap-1">
          <Check className="w-3 h-3" /> Listo para enviar
        </p>
      )}
    </div>
  );
}
