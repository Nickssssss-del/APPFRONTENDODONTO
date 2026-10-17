import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight, AlertTriangle, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { ApiError } from '@/api/http';
import type { CitaApi } from '@/api/citas';
import { diaLima, horaLima, ETIQUETA_ESTADO } from '@/lib/format';

interface Props {
  citas: CitaApi[];
  strikes: number;
  limiteStrikes: number;
  onReserve: () => void;
  onViewDentist: (id: string) => void;
  onCancel: (id: string, motivo?: string) => Promise<void>;
  onAppeal: () => void;
}

const FUTURAS = new Set(['PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'REPROGRAMADA']);

export function ResumenTab({ citas, strikes, limiteStrikes, onReserve, onViewDentist, onCancel, onAppeal }: Props) {
  const ahora = Date.now();
  const proximas = citas.filter((c) => FUTURAS.has(c.estado) && new Date(c.fin).getTime() > ahora).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const pasadas = citas.filter((c) => !proximas.includes(c) && c.estado !== 'PENDIENTE_PAGO');
  const siguiente = proximas[0] ?? null;
  const atendidas = citas.filter((c) => c.estado === 'COMPLETADA').length;

  return (
    <div id="panel-resumen" role="tabpanel" aria-labelledby="tab-resumen" className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-3">
        <Metric value={atendidas} label="Atendidas" color="text-success-600" bg="bg-success-50" />
        <Metric value={proximas.length} label="Próximas" color="text-primary-600" bg="bg-primary-50" />
        <StrikeCard strikes={strikes} max={limiteStrikes} onAppeal={onAppeal} />
      </div>

      {siguiente ? (
        <NextAppointmentCard cita={siguiente} onViewDentist={() => onViewDentist(siguiente.odontologo.id)} onCancel={onCancel} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-slatey-200 bg-white text-center px-4">
          <Calendar className="w-10 h-10 text-slatey-300" />
          <p className="text-sm text-slatey-500">No tienes citas próximas</p>
          <Button size="sm" onClick={onReserve}>Reservar cita <ChevronRight className="w-3.5 h-3.5" /></Button>
        </div>
      )}

      {pasadas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slatey-500 uppercase tracking-wide px-0.5">Últimas citas</h3>
          {pasadas.slice(0, 3).map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slatey-100">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slatey-800 truncate">{c.odontologo.nombre}</p>
                <p className="text-[11px] text-slatey-500 truncate">{c.servicio.titulo}</p>
                <p className="text-[11px] text-slatey-400">{diaLima(c.inicio)}</p>
              </div>
              <Badge variant={c.estado === 'COMPLETADA' ? 'neutral' : 'error'} size="sm">
                {c.estado === 'COMPLETADA' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} {ETIQUETA_ESTADO[c.estado]}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-3 text-center`}>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[11px] text-slatey-500 font-semibold leading-tight mt-0.5">{label}</p>
    </div>
  );
}

function StrikeCard({ strikes, max, onAppeal }: { strikes: number; max: number; onAppeal: () => void }) {
  const color = strikes === 0 ? 'text-success-600' : strikes < max ? 'text-accent-600' : 'text-error-600';
  const bg = strikes === 0 ? 'bg-success-50' : strikes < max ? 'bg-accent-50' : 'bg-error-50';
  return (
    <div className={`${bg} rounded-2xl p-3 text-center`}>
      <div className="flex justify-center gap-1 mb-1">
        {Array.from({ length: max }, (_, i) => <span key={i} className={`w-3 h-3 rounded-full border ${i < strikes ? 'bg-error-500 border-error-500' : 'border-slatey-300'}`} />)}
      </div>
      <p className={`text-[11px] font-bold ${color} leading-tight`}>{strikes === 0 ? 'Sin strikes' : `${strikes}/${max} strikes`}</p>
      {strikes > 0 && <button className="text-[10px] text-primary-600 underline mt-0.5" onClick={onAppeal}>Apelar</button>}
    </div>
  );
}

function NextAppointmentCard({ cita: c, onViewDentist, onCancel }: { cita: CitaApi; onViewDentist: () => void; onCancel: (id: string, motivo?: string) => Promise<void> }) {
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelar = async () => {
    if (!window.confirm('¿Cancelar esta cita? Según el tiempo que falte, el depósito puede reembolsarse o no.')) return;
    setCancelando(true);
    setError(null);
    try {
      await onCancel(c.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cancelar la cita.');
      setCancelando(false);
    }
  };
  const direccion = [c.odontologo.direccion, c.odontologo.distrito].filter(Boolean).join(', ');

  return (
    <div className="bg-white rounded-2xl border border-slatey-100 overflow-hidden shadow-sm">
      <div className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 border-b border-primary-100">
        <Calendar className="w-3.5 h-3.5 text-primary-500" />
        <span className="text-xs font-bold text-primary-700">Próxima cita · {ETIQUETA_ESTADO[c.estado]}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slatey-900 truncate">{c.odontologo.nombre}</p>
            <p className="text-xs text-slatey-500 truncate">{c.servicio.titulo}</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-success-500 flex-shrink-0" aria-label="Depósito pagado" />
        </div>
        <div className="flex gap-3 text-xs text-slatey-600">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary-400" /> {diaLima(c.inicio)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary-400" /> {horaLima(c.inicio)}</span>
        </div>
        {direccion && <div className="flex items-center gap-1 text-xs text-slatey-500"><MapPin className="w-3.5 h-3.5 text-slatey-400 flex-shrink-0" /><span className="truncate">{direccion}</span></div>}
        {error && <p role="alert" className="text-xs font-medium text-error-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" size="sm" className="text-xs" loading={cancelando} onClick={cancelar}>
            <AlertTriangle className="w-3.5 h-3.5 text-error-500" /> Cancelar
          </Button>
          <Button size="sm" className="text-xs" onClick={onViewDentist}>Ver perfil <ChevronRight className="w-3 h-3" /></Button>
        </div>
      </div>
    </div>
  );
}
