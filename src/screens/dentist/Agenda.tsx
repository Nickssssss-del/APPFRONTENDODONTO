import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, AlertCircle, ChevronDown, ChevronUp, ShieldCheck, Phone, Mail, MessageCircle, CheckCircle2, XCircle, FileText,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import {
  agendaOdontologo, confirmarCita, completarCita, marcarInasistencia, type CitaApi, type EstadoCita,
} from '@/api/citas';
import { ApiError, conCopiaOffline } from '@/api/http';
import { diasAgendaOdontologo, rangoAgendaOdontologo, fechaIsoLima, horaLima, soles, ETIQUETA_ESTADO } from '@/lib/format';

type Variante = 'success' | 'primary' | 'warning' | 'error' | 'neutral';
const statusConfig: Record<EstadoCita, { variant: Variante; dot: string }> = {
  PENDIENTE_PAGO: { variant: 'warning', dot: 'bg-accent-500' },
  PENDIENTE_CONFIRMACION: { variant: 'warning', dot: 'bg-accent-500' },
  CONFIRMADA: { variant: 'success', dot: 'bg-success-500' },
  COMPLETADA: { variant: 'neutral', dot: 'bg-slatey-400' },
  CANCELADA_CON_REEMBOLSO: { variant: 'error', dot: 'bg-error-500' },
  CANCELADA_SIN_REEMBOLSO: { variant: 'error', dot: 'bg-error-500' },
  INASISTENCIA_PENALIZADA: { variant: 'error', dot: 'bg-error-500' },
  REPROGRAMADA: { variant: 'primary', dot: 'bg-primary-500' },
};


type AgendaProps = {
  /** Abre la historia clínica del paciente (id = paciente.id del backend). */
  onGoToPatient: (pacienteId: string) => void;
};

const iniciales = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'PA';

export default function Agenda({ onGoToPatient }: AgendaProps) {
  const rango = useMemo(() => rangoAgendaOdontologo(), []);
  const dias = useMemo(() => diasAgendaOdontologo(), []);
  const [selectedDateIdx, setSelectedDateIdx] = useState(() => Math.max(0, dias.findIndex((d) => d.fecha === rango.hoy)));
  const diaActivo = useRef<HTMLButtonElement>(null);
  useEffect(() => { diaActivo.current?.scrollIntoView({ inline: 'center', block: 'nearest' }); }, []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accionEn, setAccionEn] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  // Ventana de 62 días (ayer → hoy+60), el máximo que acepta el backend. `hasta` es exclusivo.
  // Sin conexión muestra la última agenda guardada (lib/offline).
  const agenda = useAsync(() => conCopiaOffline('agenda', () => agendaOdontologo(rango.desde, rango.hastaExclusivo)), [rango]);
  const citasDelDia = useMemo(() => {
    const fecha = dias[selectedDateIdx].fecha;
    return (agenda.data ?? [])
      .filter((c) => fechaIsoLima(c.inicio) === fecha && c.estado !== 'PENDIENTE_PAGO')
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [agenda.data, dias, selectedDateIdx]);

  const ejecutar = async (c: CitaApi, accion: (id: string) => Promise<CitaApi>) => {
    if (accionEn) return;
    setAccionEn(c.id);
    setErrorAccion(null);
    try {
      await accion(c.id);
      agenda.reload();
    } catch (e) {
      setErrorAccion(e instanceof ApiError ? e.message : 'No se pudo completar la acción.');
    } finally {
      setAccionEn(null);
    }
  };

  const yaEmpezo = (c: CitaApi) => new Date(c.inicio).getTime() <= Date.now();

  return (
    <div className="space-y-4">
      {/* Date Carousel */}
      <div role="tablist" aria-label="Días de la agenda" className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
        {dias.map((d, i) => {
          const active = selectedDateIdx === i;
          const esHoy = d.fecha === rango.hoy;
          return (
            <button
              key={d.fecha}
              role="tab"
              aria-selected={active}
              ref={active ? diaActivo : undefined}
              onClick={() => setSelectedDateIdx(i)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl border-2 transition-all min-w-[56px] ${
                active
                  ? 'border-primary-500 bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                  : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'
              }`}
            >
              <span className={`text-[11px] font-semibold ${active ? 'text-primary-50' : ''}`}>{esHoy ? 'Hoy' : d.corto}</span>
              <span className={`text-lg font-extrabold leading-none ${active ? 'text-white' : 'text-slatey-900'}`}>{d.numero}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slatey-900">{dias[selectedDateIdx].etiqueta}</h3>
        {!agenda.loading && !agenda.error && (
          <Badge variant="primary" size="sm">{citasDelDia.length} {citasDelDia.length === 1 ? 'cita' : 'citas'}</Badge>
        )}
      </div>

      {errorAccion && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl bg-error-50 border border-error-100 px-3.5 py-3 text-xs font-medium text-error-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{errorAccion}</span>
        </div>
      )}

      {agenda.loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando agenda">
          {[0, 1].map((k) => (
            <div key={k} className="bg-white rounded-2xl border border-slatey-100 p-4 space-y-2">
              <div className="h-3 w-1/2 rounded bg-slatey-100 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-slatey-100 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-slatey-100 animate-pulse" />
            </div>
          ))}
        </div>
      )}
      {!agenda.loading && agenda.error && (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-2xl border border-error-100 bg-white p-6 text-center">
          <AlertCircle className="w-7 h-7 text-error-500" />
          <p className="text-sm font-bold text-error-700">No se pudo cargar la agenda</p>
          <p className="text-xs text-slatey-600">{agenda.error}</p>
          <Button size="sm" className="mt-1" onClick={agenda.reload}>Reintentar</Button>
        </div>
      )}
      {!agenda.loading && !agenda.error && citasDelDia.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slatey-200 bg-white p-8 text-center">
          <Clock className="w-7 h-7 text-slatey-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slatey-900">Sin citas este día</p>
          <p className="text-xs text-slatey-500 mt-1">Las citas con depósito pagado aparecerán aquí.</p>
        </div>
      )}

      {/* Appointment Cards */}
      {!agenda.loading && !agenda.error && (
        <div className="space-y-3 horizontal:grid horizontal:grid-cols-2 horizontal:items-start horizontal:gap-3 horizontal:space-y-0">
          {citasDelDia.map((c, i) => {
            const isExpanded = expandedId === c.id;
            const status = statusConfig[c.estado];
            const nombre = c.paciente?.nombre ?? 'Paciente';
            const tel = (c.paciente?.telefono ?? '').replace(/\s/g, '');
            const pagado = c.estado !== 'PENDIENTE_PAGO' && !c.estado.startsWith('CANCELADA');
            const ocupado = accionEn === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`bg-white rounded-2xl border transition-all ${
                  isExpanded ? 'border-primary-300 shadow-md shadow-primary-500/5' : 'border-slatey-100'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">
                    {iniciales(nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-slatey-500 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} aria-hidden="true" />
                      <span className="font-bold text-slatey-900">{horaLima(c.inicio)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{c.servicio.titulo}</span>
                    </div>
                    <p className="text-sm font-bold text-slatey-900 mt-1 truncate">{nombre}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {pagado && (
                        <Badge variant="success" size="sm" className="whitespace-nowrap">
                          <ShieldCheck className="w-3 h-3" /> Depósito {soles(c.depositoRequerido)}
                        </Badge>
                      )}
                      <span className="text-[11px] text-slatey-500 whitespace-nowrap">Total {soles(c.precio)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge variant={status.variant} size="sm">{ETIQUETA_ESTADO[c.estado]}</Badge>
                    <span className="text-slatey-400" aria-hidden="true">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-slatey-100"
                    >
                      <div className="p-4 space-y-3">
                        <div className="space-y-2">
                          {c.paciente?.telefono && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50">
                              <Phone className="w-4 h-4 text-slatey-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-slatey-900">{c.paciente.telefono}</span>
                              <div className="ml-auto flex items-center gap-2">
                                <a href={`tel:${tel}`} aria-label="Llamar" className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center hover:bg-success-200">
                                  <Phone className="w-4 h-4 text-success-600" />
                                </a>
                                <a href={`https://wa.me/${tel.replace(/^\+/, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center hover:bg-success-200">
                                  <MessageCircle className="w-4 h-4 text-success-600" />
                                </a>
                              </div>
                            </div>
                          )}
                          {c.paciente?.correo && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50">
                              <Mail className="w-4 h-4 text-slatey-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-slatey-900 truncate">{c.paciente.correo}</span>
                            </div>
                          )}
                        </div>

                        {c.estado === 'PENDIENTE_CONFIRMACION' && (
                          <>
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-50 border border-accent-200">
                              <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-accent-700">El paciente ya pagó el depósito. Confirma la cita para avisarle.</p>
                            </div>
                            <Button fullWidth loading={ocupado} onClick={() => ejecutar(c, confirmarCita)}>
                              <CheckCircle2 className="w-4 h-4" /> Confirmar cita
                            </Button>
                          </>
                        )}

                        {c.estado === 'CONFIRMADA' && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button loading={ocupado} onClick={() => ejecutar(c, completarCita)}>
                              <CheckCircle2 className="w-4 h-4" /> Atendida
                            </Button>
                            <Button
                              variant="outline"
                              disabled={ocupado || !yaEmpezo(c)}
                              title={yaEmpezo(c) ? undefined : 'Disponible cuando empiece la cita'}
                              onClick={() => ejecutar(c, marcarInasistencia)}
                            >
                              <XCircle className="w-4 h-4" /> No asistió
                            </Button>
                          </div>
                        )}

                        {c.estado === 'COMPLETADA' && c.paciente && (
                          <Button fullWidth variant="outline" onClick={() => onGoToPatient(c.paciente!.id)}>
                            <FileText className="w-4 h-4" /> Historia clínica
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
