import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, User, Mail, Phone, BadgeCheck, CreditCard,
  Clock, Plus, X, Check, Calendar,
} from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';

const DEFAULT_PHOTO = 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200';

const CLINIC_PHOTOS = [
  'https://images.pexels.com/photos/305567/pexels-photo-305567.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/6502543/pexels-photo-6502543.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/6809639/pexels-photo-6809639.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
  const [photo, setPhoto] = useState(DEFAULT_PHOTO);
  const [fullName, setFullName] = useState('Dr. Carlos Mendoza');
  const [specialty, setSpecialty] = useState('Odontólogo General');
  const [cop, setCop] = useState('34512');
  const [ruc, setRuc] = useState('20123456789');
  const [email, setEmail] = useState('dr.mendoza@odontosystem.pe');
  const [phone, setPhone] = useState('999 888 777');
  const [clinicPhotos, setClinicPhotos] = useState<string[]>(CLINIC_PHOTOS);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1200);
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
            <img src={photo} alt="Foto de perfil" className="w-20 h-20 rounded-2xl object-cover" />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors">
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
      </div>

      {/* Clinic Gallery */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-slatey-900">Galería del consultorio</h3>
          </div>
          <Badge variant="neutral" size="sm">{clinicPhotos.length} fotos</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {clinicPhotos.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slatey-200 group">
              <img src={img} alt={`Consultorio ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => setClinicPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-error-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setClinicPhotos((prev) => [...prev, 'https://images.pexels.com/photos/4269268/pexels-photo-4269268.jpeg?auto=compress&cs=tinysrgb&h=200&w=200'])}
            className="aspect-square rounded-xl border-2 border-dashed border-slatey-200 flex flex-col items-center justify-center text-slatey-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium mt-1">Agregar</span>
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
    </div>
  );
}
