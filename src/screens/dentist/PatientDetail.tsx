import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, CheckCircle2, Plus, Loader2, AlertCircle, Phone, Mail, Stethoscope, Pill, ClipboardList } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import { agendaOdontologo, type CitaApi } from '@/api/citas';
import { historiasEscritasPara, registrarHistoria, type Historia } from '@/api/panel';
import { agruparPacientes, iniciales } from '@/lib/pacientes';
import { diaLima, fechaIsoLima, horaLima, sumarDias } from '@/lib/format';

const DIAS_ATRAS = 0;
const DIAS_ADELANTE = 30;

type PatientDetailProps = {
  /** id del paciente (usuario) tal como lo devuelve el backend en cita.paciente.id */
  patientId: string;
  onBack: () => void;
};

export default function PatientDetail({ patientId, onBack }: PatientDetailProps) {
  const hoy = useMemo(() => fechaIsoLima(new Date()), []);
  const agenda = useAsync(() => agendaOdontologo(sumarDias(hoy, -DIAS_ATRAS), sumarDias(hoy, DIAS_ADELANTE)), [hoy]);
  const historias = useAsync((signal) => historiasEscritasPara(patientId, signal), [patientId]);

  const paciente = useMemo(() => agruparPacientes(agenda.data ?? []).find((p) => p.id === patientId), [agenda.data, patientId]);
  const citasPaciente = paciente?.citas ?? [];
  const listaHistorias: Historia[] = historias.data ?? [];
  const conHistoria = useMemo(() => new Set(listaHistorias.map((h) => h.citaId)), [listaHistorias]);
  // Una historia solo se escribe una vez por cita y solo cuando la cita ya fue atendida.
  const pendientesDeHistoria = citasPaciente.filter((c) => c.estado === 'COMPLETADA' && !conHistoria.has(c.id));

  const [formCita, setFormCita] = useState<CitaApi | null>(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const abrirForm = (c: CitaApi) => {
    setFormCita(c);
    setDiagnostico('');
    setTratamiento('');
    setNotas('');
    setErrorForm(null);
  };

  const guardar = async () => {
    if (!formCita || guardando) return;
    if (!diagnostico.trim() || !tratamiento.trim()) return setErrorForm('El diagnóstico y el tratamiento son obligatorios.');
    setGuardando(true);
    setErrorForm(null);
    try {
      await registrarHistoria(formCita.id, { diagnostico: diagnostico.trim(), tratamiento: tratamiento.trim(), notas: notas.trim() || undefined });
      setFormCita(null);
      historias.reload();
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : 'No se pudo guardar la historia clínica.');
    } finally {
      setGuardando(false);
    }
  };

  if (agenda.loading && !agenda.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20" aria-busy="true">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-sm text-slatey-500">Cargando historia clínica...</p>
      </div>
    );
  }

  if (agenda.error || !paciente) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slatey-500 hover:text-slatey-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-slatey-100 bg-white p-8 text-center">
          <AlertCircle className="w-7 h-7 text-accent-600" />
          <p className="text-sm text-slatey-600">{agenda.error ?? 'No encontramos a este paciente en tus citas recientes.'}</p>
          {agenda.error && <Button size="sm" onClick={agenda.reload}>Reintentar</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slatey-500 hover:text-slatey-700 font-medium">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold flex-shrink-0" aria-hidden="true">
            {iniciales(paciente.nombre)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slatey-900 font-display">{paciente.nombre}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="primary" size="sm"><CheckCircle2 className="w-3 h-3" /> {paciente.visitas} {paciente.visitas === 1 ? 'visita' : 'visitas'}</Badge>
              {paciente.ultimaCita && <Badge variant="neutral" size="sm">Última: {diaLima(paciente.ultimaCita)}</Badge>}
            </div>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          {paciente.telefono && (
            <a href={`tel:${paciente.telefono.replace(/\s/g, '')}`} className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50 text-sm font-semibold text-slatey-900">
              <Phone className="w-4 h-4 text-slatey-400" /> {paciente.telefono}
            </a>
          )}
          {paciente.correo && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50 text-sm font-semibold text-slatey-900 min-w-0">
              <Mail className="w-4 h-4 text-slatey-400 flex-shrink-0" /> <span className="truncate">{paciente.correo}</span>
            </div>
          )}
          {/* Alergias y Antecedentes (datos no disponibles en agenda, se muestran placeholders) */}
          <div className="space-y-2 pt-2 border-t border-slatey-100">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50 text-sm text-slatey-900">
              <AlertCircle className="w-4 h-4 text-slatey-400 flex-shrink-0" />
              <span className="font-semibold">Alergias:</span>
              <span className="text-slatey-500 ml-2">Ninguna registrada</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50 text-sm text-slatey-900">
              <FileText className="w-4 h-4 text-slatey-400 flex-shrink-0" />
              <span className="font-semibold">Antecedentes:</span>
              <span className="text-slatey-500 ml-2">Sin antecedentes registrados</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Citas atendidas sin historia */}
      {pendientesDeHistoria.length > 0 && !formCita && (
        <div className="bg-accent-50 border border-accent-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <ClipboardList className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-accent-700">
              Tienes {pendientesDeHistoria.length} {pendientesDeHistoria.length === 1 ? 'cita atendida' : 'citas atendidas'} sin historia clínica. Se escribe una sola vez por cita y no se puede editar después.
            </p>
          </div>
          {pendientesDeHistoria.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 border border-accent-100">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slatey-900 truncate">{c.servicio.titulo}</p>
                <p className="text-[11px] text-slatey-500">{diaLima(c.inicio)} · {horaLima(c.inicio)}</p>
              </div>
              <Button size="sm" onClick={() => abrirForm(c)}><Plus className="w-3.5 h-3.5" /> Registrar</Button>
            </div>
          ))}
        </div>
      )}

      {formCita && (
        <div className="bg-white rounded-2xl border-2 border-primary-200 p-4 space-y-3">
          <div>
            <p className="text-sm font-bold text-slatey-900">Historia clínica</p>
            <p className="text-xs text-slatey-500">{formCita.servicio.titulo} · {diaLima(formCita.inicio)} · {horaLima(formCita.inicio)}</p>
          </div>
          <Campo label="Diagnóstico *" valor={diagnostico} onChange={setDiagnostico} filas={3} />
          <Campo label="Tratamiento realizado *" valor={tratamiento} onChange={setTratamiento} filas={3} />
          <Campo label="Notas clínicas (opcional)" valor={notas} onChange={setNotas} filas={2} />
          {errorForm && <p role="alert" className="text-xs font-medium text-error-600">{errorForm}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setFormCita(null)} disabled={guardando}>Cancelar</Button>
            <Button loading={guardando} onClick={guardar}>Guardar</Button>
          </div>
        </div>
      )}

      {/* Historias escritas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slatey-900">Historia clínica</h3>
          <Badge variant="neutral" size="sm">{listaHistorias.length} {listaHistorias.length === 1 ? 'registro' : 'registros'}</Badge>
        </div>
        {historias.loading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary-500 animate-spin" aria-label="Cargando" /></div>}
        {historias.error && (
          <div role="alert" className="rounded-2xl border border-slatey-100 bg-white p-4 text-center space-y-2">
            <p className="text-xs text-slatey-600">{historias.error}</p>
            <Button size="sm" onClick={historias.reload}>Reintentar</Button>
          </div>
        )}
        {!historias.loading && !historias.error && listaHistorias.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slatey-200 bg-white p-6 text-center">
            <FileText className="w-7 h-7 text-slatey-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slatey-900">Sin historia clínica todavía</p>
            <p className="text-xs text-slatey-500 mt-1">Después de atender una cita podrás registrar el diagnóstico y el tratamiento.</p>
          </div>
        )}
        {listaHistorias.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
            className="bg-white rounded-2xl border border-slatey-100 p-4 space-y-3"
          >
            <div>
              <p className="text-sm font-bold text-slatey-900">{h.servicio}</p>
              <p className="text-[11px] text-slatey-500">{diaLima(h.fechaCita)} · {horaLima(h.fechaCita)}</p>
            </div>
            <Bloque icon={<Stethoscope className="w-3.5 h-3.5" />} titulo="Diagnóstico" texto={h.diagnostico} />
            <Bloque icon={<Pill className="w-3.5 h-3.5" />} titulo="Tratamiento" texto={h.tratamiento} />
            {h.notas && <Bloque icon={<FileText className="w-3.5 h-3.5" />} titulo="Notas" texto={h.notas} />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Bloque({ icon, titulo, texto }: { icon: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary-600 uppercase tracking-wide">{icon} {titulo}</p>
      <p className="text-xs text-slatey-700 leading-relaxed mt-1 whitespace-pre-wrap">{texto}</p>
    </div>
  );
}

function Campo({ label, valor, onChange, filas }: { label: string; valor: string; onChange: (v: string) => void; filas: number }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slatey-700 mb-1">{label}</span>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value.slice(0, 4000))}
        rows={filas}
        className="w-full px-3 py-2.5 rounded-xl border-2 border-slatey-200 bg-slatey-50 text-sm text-slatey-900 focus:border-primary-400 focus:bg-white focus:outline-none resize-none"
      />
    </label>
  );
}
