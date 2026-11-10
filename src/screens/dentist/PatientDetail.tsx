import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, CheckCircle2, Plus, Loader2, AlertCircle, Phone, Mail, Stethoscope, Pill, ClipboardList } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useCitasPendientesDeHistoria } from '@/hooks/useCitasPendientesDeHistoria';
import { ApiError } from '@/api/http';
import type { CitaApi } from '@/api/citas';
import { detallePaciente, historiasEscritasPara, registrarHistoria, type Historia } from '@/api/panel';
import { iniciales } from '@/lib/pacientes';
import { diaLima, horaLima } from '@/lib/format';

type PatientDetailProps = {
  /** id del paciente (usuario) tal como lo devuelve el backend en cita.paciente.id */
  patientId: string;
  onBack: () => void;
  /** Texto del enlace de regreso, p. ej. «Volver a Pacientes». */
  volverEtiqueta?: string;
};

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function PatientDetail({ patientId, onBack, volverEtiqueta = 'Volver' }: PatientDetailProps) {
  const detalle = useAsync((signal) => detallePaciente(patientId, signal), [patientId]);
  const historias = useAsync((signal) => historiasEscritasPara(patientId, signal), [patientId]);

  // Historias del servidor + las recién guardadas (se ven al instante, sin esperar la recarga). Una por cita.
  const [recienGuardadas, setRecienGuardadas] = useState<Historia[]>([]);
  const listaHistorias = useMemo<Historia[]>(() => {
    const porCita = new Map<string, Historia>();
    for (const h of historias.data ?? []) porCita.set(h.citaId, h);
    for (const h of recienGuardadas) porCita.set(h.citaId, h);
    return [...porCita.values()].sort((a, b) => b.fechaCita.localeCompare(a.fechaCita));
  }, [historias.data, recienGuardadas]);
  const conHistoria = useMemo(() => new Set(listaHistorias.map((h) => h.citaId)), [listaHistorias]);

  // Pendientes reales = citas atendidas (backend) − historias registradas (el backend admite una por cita COMPLETADA).
  const atendidas = detalle.data?.citasAtendidas;
  const objetivo = typeof atendidas === 'number' && historias.data ? Math.max(0, atendidas - listaHistorias.length) : null;

  // La búsqueda arranca una sola vez, cuando detalle e historias ya respondieron (con datos o con error).
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (!detalle.loading && !historias.loading) setListo(true);
  }, [detalle.loading, historias.loading]);
  const busqueda = useCitasPendientesDeHistoria(patientId, { listo, objetivo, conHistoria });

  const pendientes = useMemo(
    () => (busqueda.data?.citas ?? []).filter((c) => !conHistoria.has(c.id)),
    [busqueda.data, conHistoria],
  );
  const totalPendientes = Math.max(objetivo ?? 0, pendientes.length);
  const buscando = !listo || busqueda.loading;
  const noListadas = !buscando && busqueda.data ? totalPendientes - pendientes.length : 0;

  const nombrePaciente = detalle.data
    ? (detalle.data.nombreCompleto || `${detalle.data.nombre} ${detalle.data.apellido}`).trim()
    : busqueda.data?.citas[0]?.paciente?.nombre ?? '';
  const telefono = detalle.data?.telefono ?? null;
  const correo = detalle.data?.correo ?? null;

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
      const creada = await registrarHistoria(formCita.id, { diagnostico: diagnostico.trim(), tratamiento: tratamiento.trim(), notas: notas.trim() || undefined });
      setRecienGuardadas((prev) => [creada, ...prev.filter((h) => h.citaId !== creada.citaId)]);
      setFormCita(null);
      setDiagnostico('');
      setTratamiento('');
      setNotas('');
      historias.reload();
    } catch (e) {
      // 409: la cita ya tiene historia (p. ej. desde otro dispositivo). Se recarga para que salga de pendientes.
      if (e instanceof ApiError && e.status === 409) historias.reload();
      setErrorForm(e instanceof ApiError ? e.message : 'No se pudo guardar la historia clínica.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slatey-500 hover:text-slatey-700 font-medium min-h-[44px]">
        <ArrowLeft className="w-4 h-4" /> {volverEtiqueta}
      </button>

      {/* Datos del paciente */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        aria-label="Datos del paciente"
        className="bg-white rounded-2xl p-4 border border-slatey-100"
      >
        {detalle.loading && !detalle.data ? (
          <div className="flex items-center gap-3" aria-busy="true" aria-label="Cargando datos del paciente">
            <div className="w-14 h-14 rounded-2xl bg-slatey-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-slatey-100 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-slatey-100 animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold flex-shrink-0" aria-hidden="true">
                {iniciales(nombrePaciente || 'Paciente')}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slatey-900 font-display leading-tight break-words">{nombrePaciente || 'Paciente'}</h2>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {typeof atendidas === 'number' && (
                    <Badge variant="primary" size="sm"><CheckCircle2 className="w-3 h-3" /> {plural(atendidas, 'visita atendida', 'visitas atendidas')}</Badge>
                  )}
                  {detalle.data?.ultimaAtencion && <Badge variant="neutral" size="sm">Última: {diaLima(detalle.data.ultimaAtencion)}</Badge>}
                </div>
              </div>
            </div>

            {(telefono || correo) && (
              <div className="mt-3 space-y-1.5 text-sm">
                {telefono && (
                  <a href={`tel:${telefono.replace(/\s/g, '')}`} className="flex items-center gap-2 text-slatey-700 font-medium min-h-[32px]">
                    <Phone className="w-4 h-4 text-slatey-400 flex-shrink-0" /> {telefono}
                  </a>
                )}
                {correo && (
                  <p className="flex items-center gap-2 text-slatey-700 font-medium min-w-0">
                    <Mail className="w-4 h-4 text-slatey-400 flex-shrink-0" /> <span className="truncate">{correo}</span>
                  </p>
                )}
              </div>
            )}

            {(detalle.data?.alergias || detalle.data?.antecedentes) && (
              <div className="mt-3 pt-3 border-t border-slatey-100 space-y-1 text-xs">
                {detalle.data?.alergias && (
                  <p><span className="font-bold text-error-600">Alergias:</span> <span className="text-slatey-700">{detalle.data.alergias}</span></p>
                )}
                {detalle.data?.antecedentes && (
                  <p><span className="font-bold text-slatey-700">Antecedentes:</span> <span className="text-slatey-600">{detalle.data.antecedentes}</span></p>
                )}
              </div>
            )}

            {detalle.error && (
              <div role="alert" className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slatey-50 p-3">
                <p className="text-xs text-slatey-600">{detalle.error}</p>
                <Button size="sm" variant="outline" onClick={detalle.reload}>Reintentar</Button>
              </div>
            )}
          </>
        )}
      </motion.section>

      {/* Citas atendidas sin historia clínica */}
      {!formCita && (buscando ? (objetivo ?? 0) > 0 : (totalPendientes > 0 || !!busqueda.error)) && (
        <section aria-label="Citas atendidas sin historia clínica" className="bg-accent-50 border border-accent-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <ClipboardList className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-accent-700">
              {totalPendientes > 0 && (
                <><strong>{plural(totalPendientes, 'cita atendida', 'citas atendidas')} sin historia clínica.</strong> </>
              )}
              Se registra una sola vez por cita y no se puede editar después.
            </p>
          </div>

          {buscando && (
            <p className="flex items-center gap-2 text-xs text-accent-700" aria-busy="true">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando las citas…
            </p>
          )}

          {!buscando && busqueda.error && (
            <div role="alert" className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 border border-accent-100">
              <p className="text-xs text-slatey-600">{busqueda.error}</p>
              <Button size="sm" variant="outline" onClick={busqueda.reload}>Reintentar</Button>
            </div>
          )}

          {!buscando && pendientes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 border border-accent-100">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slatey-900 truncate">{c.servicio.titulo}</p>
                <p className="text-[11px] text-slatey-500">{diaLima(c.inicio)} · {horaLima(c.inicio)}</p>
              </div>
              <Button size="sm" onClick={() => abrirForm(c)} disabled={guardando} className="flex-shrink-0">
                <Plus className="w-3.5 h-3.5" /> Registrar
              </Button>
            </div>
          ))}

          {noListadas > 0 && busqueda.data && (
            <p className="rounded-xl bg-white/70 p-2.5 text-[11px] text-slatey-600">
              {plural(noListadas, 'cita es anterior', 'citas son anteriores')} al {diaLima(`${busqueda.data.revisadoDesde}T12:00:00Z`)} y no se muestra{noListadas === 1 ? '' : 'n'} aquí.
            </p>
          )}
        </section>
      )}

      {formCita && (
        <section aria-label="Registrar historia clínica" className="bg-white rounded-2xl border-2 border-primary-200 p-4 space-y-3">
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
        </section>
      )}

      {/* Historias registradas */}
      <section aria-label="Historia clínica" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slatey-900">Historia clínica</h3>
          <Badge variant="primary" size="sm">{plural(listaHistorias.length, 'registro', 'registros')}</Badge>
        </div>
        {historias.loading && listaHistorias.length === 0 && (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary-500 animate-spin" aria-label="Cargando historias" /></div>
        )}
        {historias.error && (
          <div role="alert" className="rounded-2xl border border-slatey-100 bg-white p-4 text-center space-y-2">
            <p className="text-xs text-slatey-600">{historias.error}</p>
            <Button size="sm" onClick={historias.reload}>Reintentar</Button>
          </div>
        )}
        {!historias.loading && !historias.error && listaHistorias.length === 0 && totalPendientes === 0 && !buscando && (
          <div className="rounded-2xl border border-dashed border-slatey-200 bg-white p-6 text-center">
            <FileText className="w-7 h-7 text-slatey-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slatey-900">Sin historia clínica todavía</p>
            <p className="text-xs text-slatey-500 mt-1">Después de atender una cita podrás registrar el diagnóstico y el tratamiento.</p>
          </div>
        )}
        {listaHistorias.map((h, i) => (
          <motion.article
            key={h.citaId}
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
          </motion.article>
        ))}
      </section>

      {/* Sin datos de ningún lado: el paciente no existe para este odontólogo o no hay conexión. */}
      {!detalle.loading && !historias.loading && detalle.error && historias.error && (
        <p className="flex items-center gap-2 px-1 text-xs text-slatey-500">
          <AlertCircle className="w-3.5 h-3.5" /> Revisa tu conexión y vuelve a intentarlo.
        </p>
      )}
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
