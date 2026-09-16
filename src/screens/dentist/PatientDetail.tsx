import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, FileText, Image as ImageIcon, Pill,
  Stethoscope, Upload, Download, Calendar, Activity,
  CheckCircle2, Plus, Maximize2, X, Loader2, CalendarClock, Pencil, Check,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { ClinicalEntry } from '@/types';
import { getPatientRecord, getPatientById } from '@/lib/dentistData';

const entryTypeConfig: Record<ClinicalEntry['type'], { icon: typeof FileText; label: string; color: string; bg: string }> = {
  evolution: { icon: Activity, label: 'Evolución', color: 'text-primary-600', bg: 'bg-primary-50' },
  odontogram: { icon: Stethoscope, label: 'Odontograma', color: 'text-success-600', bg: 'bg-success-50' },
  xray: { icon: ImageIcon, label: 'Radiografía', color: 'text-accent-600', bg: 'bg-accent-50' },
  tomography: { icon: FileText, label: 'Tomografía', color: 'text-slatey-600', bg: 'bg-slatey-100' },
  prescription: { icon: Pill, label: 'Receta', color: 'text-error-600', bg: 'bg-error-50' },
};

type PatientDetailProps = {
  patientId: string;
  onBack: () => void;
};

export default function PatientDetail({ patientId, onBack }: PatientDetailProps) {
  const [filterType, setFilterType] = useState<ClinicalEntry['type'] | 'all'>('all');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingNextAppt, setEditingNextAppt] = useState(false);
  const [nextApptDate, setNextApptDate] = useState('2026-10-15');
  const [nextApptTime, setNextApptTime] = useState('10:00');
  const [nextApptSaved, setNextApptSaved] = useState(false);

  const patient = getPatientById(patientId);
  const record = getPatientRecord(patientId);

  if (!patient || !record) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-sm text-slatey-500">Cargando historia clínica...</p>
        <button onClick={onBack} className="mt-4 text-sm text-primary-600 font-semibold">
          Volver
        </button>
      </div>
    );
  }

  const filteredHistory = filterType === 'all'
    ? record.history
    : record.history.filter((e) => e.type === filterType);

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    setShowAddNote(false);
    setNewNote('');
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slatey-500 hover:text-slatey-700 font-medium">
        <ArrowLeft className="w-4 h-4" /> Volver a la agenda
      </button>

      {/* Patient Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-start gap-4">
          <img src={record.photo} alt={record.name} className="w-16 h-16 rounded-2xl object-cover" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slatey-900 font-display">{record.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="neutral" size="sm">DNI: {record.dni}</Badge>
              <Badge variant="neutral" size="sm">{record.age} años</Badge>
              <Badge variant="primary" size="sm"><CheckCircle2 className="w-3 h-3" /> {record.totalVisits} visitas</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slatey-50">
            <p className="text-xs text-slatey-500 mb-0.5">Última visita</p>
            <p className="text-sm font-bold text-slatey-900">{record.lastVisit}</p>
          </div>
          <div className="p-3 rounded-xl bg-slatey-50">
            <p className="text-xs text-slatey-500 mb-0.5">Tratamiento actual</p>
            <p className="text-sm font-bold text-slatey-900">{record.currentTreatment}</p>
          </div>
        </div>
      </motion.div>

      {/* HD Medical Images Module */}
      <div className="bg-white rounded-2xl p-4 border border-slatey-100">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-bold text-slatey-900">Archivos médicos e imágenes</h3>
        </div>
        <p className="text-xs text-slatey-500 mb-3">Odontogramas, radiografías, tomografías y placas en alta resolución</p>
        <div className="grid grid-cols-2 gap-3">
          {record.history.filter((e) => e.attachments.length > 0).flatMap((entry) =>
            entry.attachments.map((img, idx) => (
              <div key={`${entry.id}-${idx}`} className="relative group rounded-xl overflow-hidden border border-slatey-200 aspect-[4/3]">
                <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slatey-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-[10px] text-white font-semibold truncate">{entry.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <button onClick={() => setPreviewImage(img)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 text-primary-600 text-[10px] font-semibold hover:bg-white">
                      <Maximize2 className="w-3 h-3" /> Ver HD
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 text-slatey-600 text-[10px] font-semibold hover:bg-white">
                      <Download className="w-3 h-3" /> Descargar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <button className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm font-medium">
          <Upload className="w-4 h-4" /> Cargar imagen de alta resolución
        </button>
      </div>

      {/* Add Evolution Note */}
      <div className="bg-white rounded-2xl p-4 border border-slatey-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-slatey-900">Registrar evolución clínica</h3>
          </div>
          <button onClick={() => setShowAddNote(!showAddNote)} className="text-xs text-primary-600 font-semibold hover:underline">
            {showAddNote ? 'Cancelar' : 'Nueva nota'}
          </button>
        </div>
        <AnimatePresence>
          {showAddNote && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Describe la evolución clínica del paciente..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none transition-all text-sm resize-none"
              />
              <input
                type="text"
                placeholder="Prescripción (ej. Ibuprofeno 600mg c/8h)"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none transition-all text-sm"
              />
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm font-medium">
                <Upload className="w-4 h-4" /> Adjuntar imagen o receta
              </button>
              <Button fullWidth onClick={handleSaveNote} disabled={!newNote.trim()}>Guardar evolución</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline Filters */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Calendar className="w-4 h-4 text-slatey-500" />
          <h3 className="text-sm font-bold text-slatey-900">Historia clínica de {record.name.split(' ')[0]}</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {([
            { id: 'all' as const, label: 'Todo' },
            { id: 'evolution' as const, label: 'Evolución' },
            { id: 'odontogram' as const, label: 'Odontograma' },
            { id: 'xray' as const, label: 'Radiografía' },
            { id: 'tomography' as const, label: 'Tomografía' },
            { id: 'prescription' as const, label: 'Recetas' },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                filterType === f.id ? 'border-primary-400 bg-primary-500 text-white' : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clinical Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slatey-200" />
        <div className="space-y-4">
          {filteredHistory.map((entry, i) => {
            const config = entryTypeConfig[entry.type];
            const Icon = config.icon;
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative pl-14">
                <div className={`absolute left-0 top-1 w-10 h-10 rounded-2xl ${config.bg} flex items-center justify-center border-2 border-white shadow-sm`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slatey-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slatey-900">{entry.date}</span>
                      <span className="text-xs text-slatey-400">·</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slatey-400" />
                        <span className="text-xs text-slatey-500">{entry.time}</span>
                      </div>
                    </div>
                    <Badge variant="neutral" size="sm">{config.label}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slatey-900 mb-1">{entry.title}</h4>
                  <p className="text-xs text-slatey-600 leading-relaxed">{entry.description}</p>
                  {entry.attachments.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {entry.attachments.map((img, idx) => (
                        <button key={idx} onClick={() => setPreviewImage(img)} className="aspect-square rounded-xl overflow-hidden border border-slatey-200 hover:border-primary-300 transition-colors">
                          <img src={img} alt={`Adjunto ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  {entry.attachments.length > 0 && (
                    <button className="mt-3 flex items-center gap-1.5 text-xs text-primary-600 font-semibold hover:underline">
                      <Download className="w-3.5 h-3.5" /> Descargar archivos
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Sugerencia de próxima cita */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-5 border-2 border-primary-200"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slatey-900">Sugerencia de próxima cita</h3>
            <p className="text-xs text-slatey-500">Según tu último tratamiento: {record.currentTreatment}</p>
          </div>
        </div>

        {!editingNextAppt ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-primary-100">
              <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-slatey-500">Fecha sugerida</p>
                <p className="text-sm font-bold text-slatey-900">
                  {new Date(nextApptDate + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-bold text-slatey-900">{nextApptTime}</span>
              </div>
            </div>
            {nextApptSaved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success-50 border border-success-100"
              >
                <Check className="w-4 h-4 text-success-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-success-700">Fecha confirmada según tu disponibilidad</span>
              </motion.div>
            )}
            <button
              onClick={() => { setEditingNextAppt(true); setNextApptSaved(false); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Modificar según mi disponibilidad
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slatey-700 mb-1.5">Nueva fecha</label>
                <input
                  type="date"
                  value={nextApptDate}
                  onChange={(e) => setNextApptDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slatey-200 bg-white text-slatey-900 focus:border-primary-400 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slatey-700 mb-1.5">Nueva hora</label>
                <input
                  type="time"
                  value={nextApptTime}
                  onChange={(e) => setNextApptTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slatey-200 bg-white text-slatey-900 focus:border-primary-400 focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingNextAppt(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-slatey-200 text-slatey-600 text-sm font-semibold hover:bg-slatey-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setEditingNextAppt(false); setNextApptSaved(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success-500 text-white text-sm font-bold hover:bg-success-600 transition-colors"
              >
                <Check className="w-4 h-4" /> Confirmar
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Full-screen Image Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 bg-slatey-900/90 flex items-center justify-center p-4"
          >
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={previewImage}
              alt="Vista alta resolución"
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
            <button className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-600 font-semibold text-sm hover:bg-slatey-100">
              <Download className="w-4 h-4" /> Descargar archivo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
