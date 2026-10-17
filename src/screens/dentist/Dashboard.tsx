import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, DollarSign, Users, Clock, ArrowRight, Lock, Unlock, AlertCircle,
  CheckCircle2, XCircle, User as UserIcon, ShieldCheck, Loader2, Wallet, Hourglass,
} from 'lucide-react';
import { useApp } from '@/storeHooks';
import { Badge, Button } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import { agendaOdontologo, completarCita, marcarInasistencia, type CitaApi } from '@/api/citas';
import { agendaHoy, confirmarAgendaHoy, misIngresos } from '@/api/panel';
import { fechaIsoLima, horaLima, diaLima, soles, sumarDias, ETIQUETA_ESTADO } from '@/lib/format';
import { iniciales } from '@/lib/pacientes';

const TOLERANCIA_MIN = 15;
const DIAS_AGENDA = 14;
const DIAS_GRAFICO = 7;

type DashboardProps = {
  dentistName: string;
  onGoToAgenda: () => void;
  onGoToPatient: (pacienteId: string) => void;
};

const ESTADOS_ACTIVOS = new Set(['PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'COMPLETADA', 'REPROGRAMADA']);

function IncomeBar({ day, income, heightPct, index }: { day: string; income: number; heightPct: number; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex-1 flex flex-col items-center gap-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
    >
      <div className="relative w-full" style={{ height: 120 }}>
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slatey-700 whitespace-nowrap">
          {income > 0 ? `S/ ${income.toFixed(0)}` : ''}
        </span>
        {hovered && income > 0 && (
          <span className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slatey-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap z-10">
            {soles(income)}
          </span>
        )}
        <div className="w-full h-full flex items-end">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${heightPct}%` }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 120, damping: 20 }}
            className={`w-full rounded-t-lg ${income > 0 ? 'bg-gradient-to-t from-primary-500 to-primary-400' : 'bg-slatey-100'}`}
            style={{ minHeight: income > 0 ? 8 : 2 }}
          />
        </div>
      </div>
      <span className="text-[10px] font-semibold text-slatey-500">{day}</span>
    </div>
  );
}

export default function Dashboard({ dentistName, onGoToAgenda, onGoToPatient }: DashboardProps) {
  const { showWelcomeBanner, setShowWelcomeBanner, confirmarCitaReal } = useApp();
  const hoy = useMemo(() => fechaIsoLima(new Date()), []);

  // `hasta` es exclusivo del backend.
  const agenda = useAsync(() => agendaOdontologo(hoy, sumarDias(hoy, DIAS_AGENDA)), [hoy]);
  const ingresos = useAsync(() => misIngresos(), []);
  const estadoHoy = useAsync(() => agendaHoy(), []);

  const [accionEn, setAccionEn] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [cambiandoAgenda, setCambiandoAgenda] = useState(false);

  const citas = agenda.data ?? [];
  const citasHoy = useMemo(
    () => citas.filter((c) => fechaIsoLima(c.inicio) === hoy && ESTADOS_ACTIVOS.has(c.estado)).sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [citas, hoy],
  );
  const pendientes = useMemo(
    () => citas.filter((c) => c.estado === 'PENDIENTE_CONFIRMACION').sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [citas],
  );
  // Próximo paciente: la primera cita confirmada de hoy que aún no termina.
  const siguiente: CitaApi | undefined = citasHoy.find((c) => c.estado === 'CONFIRMADA' && new Date(c.fin).getTime() > Date.now());

  const grafico = useMemo(() => {
    const dias = Array.from({ length: DIAS_GRAFICO }, (_, i) => sumarDias(hoy, i - (DIAS_GRAFICO - 1)));
    const porDia = new Map<string, number>(dias.map((d) => [d, 0]));
    for (const l of ingresos.data?.liquidaciones ?? []) {
      const f = fechaIsoLima(l.fechaCita);
      if (porDia.has(f)) porDia.set(f, (porDia.get(f) ?? 0) + Number(l.monto));
    }
    return dias.map((f) => ({ dia: diaLima(`${f}T12:00:00-05:00`).split(' ').slice(0, 2).join(' '), monto: porDia.get(f) ?? 0 }));
  }, [ingresos.data, hoy]);
  const maxMonto = Math.max(...grafico.map((d) => d.monto), 1);
  const totalGrafico = grafico.reduce((s, d) => s + d.monto, 0);

  const ejecutar = async (id: string, accion: () => Promise<unknown>) => {
    if (accionEn) return;
    setAccionEn(id);
    setErrorAccion(null);
    try {
      await accion();
      agenda.reload();
      ingresos.reload();
      estadoHoy.reload();
    } catch (e) {
      setErrorAccion(e instanceof ApiError ? e.message : 'No se pudo completar la acción.');
    } finally {
      setAccionEn(null);
    }
  };

  const cambiarAgendaHoy = async (atiende: boolean) => {
    if (cambiandoAgenda) return;
    if (!atiende && !window.confirm('Se cancelarán con reembolso del 100 % tus citas pendientes de hoy y cada paciente recibirá un correo. ¿Continuar?')) return;
    setCambiandoAgenda(true);
    setErrorAccion(null);
    try {
      await confirmarAgendaHoy(atiende, atiende ? undefined : 'El odontólogo no atenderá hoy');
      estadoHoy.reload();
      agenda.reload();
    } catch (e) {
      setErrorAccion(e instanceof ApiError ? e.message : 'No se pudo actualizar la agenda de hoy.');
    } finally {
      setCambiandoAgenda(false);
    }
  };

  const yaEmpezo = (c: CitaApi) => new Date(c.inicio).getTime() <= Date.now();
  const pasoTolerancia = (c: CitaApi) => Date.now() >= new Date(c.inicio).getTime() + TOLERANCIA_MIN * 60_000;

  const atiendeHoy = estadoHoy.data?.atiende;

  return (
    <div className="space-y-5">
      {showWelcomeBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-5 text-white shadow-lg shadow-primary-500/20"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold font-display mb-1">¡Bienvenido/a, {dentistName || 'doctor/a'}!</h2>
            <p className="text-sm text-primary-100 mb-4">Esto es lo que tienes hoy:</p>
            <div className="flex gap-4">
              <div className="flex-1 bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-primary-100" />
                  <span className="text-xs text-primary-100">Citas hoy</span>
                </div>
                <p className="text-2xl font-extrabold">{agenda.loading ? '…' : citasHoy.length}</p>
              </div>
              <div className="flex-1 bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-primary-100" />
                  <span className="text-xs text-primary-100">Por confirmar</span>
                </div>
                <p className="text-2xl font-extrabold">{agenda.loading ? '…' : pendientes.length}</p>
              </div>
            </div>
            <button onClick={() => setShowWelcomeBanner(false)} className="mt-3 text-xs text-primary-100 hover:text-white font-medium">
              Cerrar resumen
            </button>
          </div>
        </motion.div>
      )}

      {errorAccion && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl bg-error-50 border border-error-100 px-3.5 py-3 text-xs font-medium text-error-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{errorAccion}</span>
        </div>
      )}

      {/* ¿Atiendes hoy? (POST /api/odontologos/yo/agenda-hoy) */}
      {atiendeHoy === false ? (
        <button
          id="dentist-lock-agenda-button"
          data-testid="dentist-lock-agenda-button"
          onClick={() => cambiarAgendaHoy(true)}
          disabled={cambiandoAgenda}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-error-500 text-white hover:bg-error-600 shadow-md shadow-error-500/20 disabled:opacity-60"
        >
          <Unlock className="w-4 h-4" /> Agenda de hoy cerrada · Toca para reabrirla
        </button>
      ) : (
        <button
          id="dentist-lock-agenda-button"
          data-testid="dentist-lock-agenda-button"
          onClick={() => cambiarAgendaHoy(false)}
          disabled={cambiandoAgenda || estadoHoy.loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-slatey-800 text-white hover:bg-slatey-900 shadow-md shadow-slatey-900/10 disabled:opacity-60"
        >
          <Lock className="w-4 h-4" /> No atenderé hoy · Cerrar agenda
        </button>
      )}
      {atiendeHoy === null && !estadoHoy.loading && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-50 border border-accent-200">
          <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-accent-700">Aún no confirmaste si atiendes hoy. Sin confirmar, no se aceptan reservas para hoy.</p>
            <Button size="sm" className="mt-2" loading={cambiandoAgenda} onClick={() => cambiarAgendaHoy(true)}>
              <CheckCircle2 className="w-4 h-4" /> Sí, atiendo hoy
            </Button>
          </div>
        </div>
      )}
      {atiendeHoy === false && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-error-50 border border-error-100 text-error-700">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs font-semibold">Agenda cerrada: no se aceptan reservas hoy.</p>
        </div>
      )}

      {/* Solicitudes pendientes de confirmar (confirmación manual) */}
      <section id="dentist-pending-requests" data-testid="dentist-pending-requests" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slatey-900">Reservas por confirmar</h3>
          {pendientes.length > 0 && <Badge variant="warning" size="sm" data-testid="dentist-pending-requests-badge">{pendientes.length} nuevas</Badge>}
        </div>
        {agenda.loading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary-500 animate-spin" aria-label="Cargando" /></div>}
        {!agenda.loading && !agenda.error && pendientes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slatey-200 bg-white p-4 text-center">
            <p className="text-xs text-slatey-500">No tienes reservas pendientes de confirmar.</p>
          </div>
        )}
        {pendientes.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-accent-200 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slatey-900">{c.paciente?.nombre ?? 'Paciente'}</p>
                <p className="text-xs font-semibold text-slatey-700 mt-1">{diaLima(c.inicio)} · {horaLima(c.inicio)} · {c.servicio.titulo}</p>
                <p className="text-[11px] text-slatey-500 mt-0.5">Depósito pagado: {soles(c.depositoRequerido)}</p>
              </div>
            </div>
            <Button fullWidth loading={accionEn === c.id} onClick={() => ejecutar(c.id, () => confirmarCitaReal(c.id))}>
              <CheckCircle2 className="w-4 h-4" /> Confirmar cita
            </Button>
          </div>
        ))}
      </section>

      {/* Próximo paciente */}
      {siguiente && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-white border-2 border-primary-200 shadow-lg shadow-primary-500/10"
        >
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-white" />
              <span className="text-xs font-bold uppercase tracking-wide">Próximo paciente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-100" />
              <span className="text-sm font-bold">{horaLima(siguiente.inicio)}</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold" aria-hidden="true">
                {iniciales(siguiente.paciente?.nombre ?? '')}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slatey-900 font-display truncate">{siguiente.paciente?.nombre ?? 'Paciente'}</h3>
                {siguiente.paciente?.telefono && <p className="text-xs text-slatey-500 mt-0.5">{siguiente.paciente.telefono}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50">
              <Calendar className="w-4 h-4 text-slatey-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slatey-500">Procedimiento</p>
                <p className="text-sm font-bold text-slatey-900 truncate">{siguiente.servicio.titulo}</p>
              </div>
              <Badge variant="success" size="sm"><ShieldCheck className="w-3 h-3" /> {soles(siguiente.depositoRequerido)} pagado</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="success"
                loading={accionEn === siguiente.id}
                disabled={!yaEmpezo(siguiente)}
                title={yaEmpezo(siguiente) ? undefined : 'Disponible cuando empiece la cita'}
                onClick={() => ejecutar(siguiente.id, () => completarCita(siguiente.id))}
              >
                <CheckCircle2 className="w-5 h-5" /> Atención realizada
              </Button>
              <Button
                variant="danger"
                disabled={accionEn === siguiente.id || !pasoTolerancia(siguiente)}
                title={pasoTolerancia(siguiente) ? undefined : `Disponible ${TOLERANCIA_MIN} min después de la hora`}
                onClick={() => ejecutar(siguiente.id, () => marcarInasistencia(siguiente.id))}
              >
                <XCircle className="w-5 h-5" /> Inasistencia
              </Button>
            </div>
            {siguiente.paciente && (
              <button
                onClick={() => onGoToPatient(siguiente.paciente!.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-50 text-primary-600 text-sm font-bold hover:bg-primary-100 transition-colors"
              >
                Ver historia clínica <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Métricas reales: depósitos (liquidaciones) y agenda */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Wallet, label: 'Depósitos cobrados', value: soles(ingresos.data?.pagado), sub: 'Ya transferidos a ti', color: 'primary' as const },
          { icon: Hourglass, label: 'En custodia', value: soles(ingresos.data?.enCustodia), sub: 'Se pagan 72 h después de la cita', color: 'accent' as const },
          { icon: Calendar, label: 'Citas hoy', value: agenda.loading ? '…' : String(citasHoy.length), sub: `${citas.filter((c) => ESTADOS_ACTIVOS.has(c.estado)).length} en los próximos ${DIAS_AGENDA} días`, color: 'success' as const },
          { icon: DollarSign, label: 'Devueltos a pacientes', value: soles(ingresos.data?.devueltoAPacientes), sub: 'Cancelaciones con reembolso', color: 'error' as const },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-4 border border-slatey-100"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
                stat.color === 'primary' ? 'bg-primary-50' : stat.color === 'success' ? 'bg-success-50' : stat.color === 'accent' ? 'bg-accent-50' : 'bg-error-50'
              }`}>
                <Icon className={`w-5 h-5 ${
                  stat.color === 'primary' ? 'text-primary-500' : stat.color === 'success' ? 'text-success-500' : stat.color === 'accent' ? 'text-accent-600' : 'text-error-500'
                }`} />
              </div>
              <p className="text-xl font-extrabold text-slatey-900">{stat.value}</p>
              <p className="text-xs font-semibold text-slatey-600 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-slatey-400 mt-0.5">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>
      {ingresos.error && <p role="alert" className="text-xs text-error-600 px-1">No se pudieron cargar tus ingresos: {ingresos.error}</p>}

      {/* Depósitos por día de cita (liquidaciones reales) */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-slatey-900">Depósitos por día</h3>
          </div>
          <Badge variant="primary" size="sm">{soles(totalGrafico)} · {DIAS_GRAFICO} días</Badge>
        </div>
        {!ingresos.loading && totalGrafico === 0 ? (
          <p className="text-xs text-slatey-500 text-center py-6">Aún no hay depósitos registrados en los últimos {DIAS_GRAFICO} días.</p>
        ) : (
          <div className="flex justify-between gap-2">
            {grafico.map((d, i) => (
              <IncomeBar key={i} day={d.dia} income={d.monto} heightPct={(d.monto / maxMonto) * 100} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Agenda de hoy */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slatey-900">Agenda hoy</h3>
          <button onClick={onGoToAgenda} className="flex items-center gap-1 text-xs text-primary-600 font-semibold hover:underline">
            Ver agenda <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {agenda.error && (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-slatey-100 bg-white p-6 text-center">
            <AlertCircle className="w-6 h-6 text-accent-600" />
            <p className="text-sm text-slatey-600">{agenda.error}</p>
            <Button size="sm" onClick={agenda.reload}>Reintentar</Button>
          </div>
        )}
        {!agenda.loading && !agenda.error && citasHoy.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slatey-200 bg-white p-6 text-center">
            <p className="text-sm font-bold text-slatey-900">Sin citas hoy</p>
            <p className="text-xs text-slatey-500 mt-1">Las citas con depósito pagado aparecerán aquí.</p>
          </div>
        )}
        <div className="space-y-2">
          {citasHoy.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              disabled={!c.paciente}
              onClick={() => c.paciente && onGoToPatient(c.paciente.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-slatey-100 hover:border-primary-200 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">
                {iniciales(c.paciente?.nombre ?? '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slatey-400" />
                  <span className="text-xs font-bold text-slatey-900">{horaLima(c.inicio)}</span>
                  <span className="text-xs text-slatey-400">·</span>
                  <span className="text-xs text-slatey-500 truncate">{c.paciente?.nombre ?? 'Paciente'}</span>
                </div>
                <p className="text-xs text-slatey-400 mt-0.5 truncate">{c.servicio.titulo}</p>
              </div>
              <Badge variant={c.estado === 'CONFIRMADA' ? 'success' : c.estado === 'COMPLETADA' ? 'neutral' : 'warning'} size="sm">
                {ETIQUETA_ESTADO[c.estado]}
              </Badge>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
