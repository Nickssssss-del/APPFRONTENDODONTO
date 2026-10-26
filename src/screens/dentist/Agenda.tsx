import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, AlertCircle, ChevronDown, ChevronUp, ShieldCheck, Phone, Mail, MessageCircle, Loader2, CheckCircle2, XCircle, FileText,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import {
  agendaOdontologo, confirmarCita, completarCita, marcarInasistencia, type CitaApi, type EstadoCita,
} from '@/api/citas';
import { ApiError } from '@/api/http';
import { proximosDias, sumarDias, fechaIsoLima, horaLima, soles, ETIQUETA_ESTADO } from '@/lib/format';

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

const DIAS_AGENDA = 14;

type AgendaProps = {
  /** Abre la historia clínica del paciente (id = paciente.id del backend). */
  onGoToPatient: (pacienteId: string) => void;
};

const iniciales = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'PA';

export default function Agenda({ onGoToPatient }: AgendaProps) {
  const dias = useMemo(() => proximosDias(DIAS_AGENDA), []);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accionEn, setAccionEn] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  // `hasta` es exclusivo: se pide un día más allá del último visible.
  const agenda = useAsync(() => agendaOdontologo(dias[0].fecha, sumarDias(dias[dias.length - 1].fecha, 1)), [dias]);
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
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
        {dias.map((d, i) => {
          const active = selectedDateIdx === i;
          return (
            <button
              key={d.fecha}
              onClick={() => setSelectedDateIdx(i)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl border-2 transition-all min-w-[64px] ${
                active
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'
              }`}
            >
              <span className="text-xs font-semibold">{d.corto}</span>
              <span className="text-lg font-extrabold">{d.numero}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slatey-900">{dias[selectedDateIdx].etiqueta}</h3>
        <Badge variant="primary" size="sm">{citasDelDia.length} citas</Badge>
      </div>

      {errorAccion && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl bg-error-50 border border-error-100 px-3.5 py-3 text-xs font-medium text-error-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{errorAccion}</span>
        </div>
      )}

      {agenda.loading && (
        <div className="flex justify-center py-10" aria-busy="true">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" aria-label="Cargando agenda" />
        </div>
      )}
      {!agenda.loading && agenda.error && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-slatey-100 bg-white p-8 text-center">
          <AlertCircle className="w-7 h-7 text-accent-600" />
          <p className="text-sm text-slatey-600">{agenda.error}</p>
          <Button size="sm" onClick={agenda.reload}>Reintentar</Button>
        </div>
      )}
      {!agenda.loading && !agenda.error && citasDelDia.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slatey-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-slatey-900">Sin citas este día</p>
          <p className="text-xs text-slatey-500 mt-1">Las citas con depósito pagado aparecerán aquí.</p>
        </div>
      )}

      {/* Appointment Cards */}
      {!agenda.loading && !agenda.error && (
        <div className="space-y-3">
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
                <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold" aria-hidden="true">
                      {iniciales(nombre)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${status.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slatey-400" />
                      <span className="text-sm font-bold text-slatey-900">{horaLima(c.inicio)}</span>
                      <span className="text-xs text-slatey-500">·</span>
                      <span className="text-xs text-slatey-500 truncate">{c.servicio.titulo}</span>
                    </div>
                    <p className="text-sm font-semibold text-slatey-900 mt-0.5">{nombre}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant={status.variant} size="sm">{ETIQUETA_ESTADO[c.estado]}</Badge>
                      {pagado && (
                        <Badge variant="success" size="sm">
                          <ShieldCheck className="w-3 h-3" /> {soles(c.depositoRequerido)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-slatey-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </motion.div>
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
