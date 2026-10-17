import { motion } from 'framer-motion';
import { Stethoscope, Pill, FileText } from 'lucide-react';
import type { Historia } from '@/api/panel';
import { diaLima, horaLima } from '@/lib/format';
import { HistorialSkeleton, EmptyState, ErrorState } from './States';

interface Props {
  entries: Historia[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onReserve: () => void;
}

/** Historial clínico real del paciente: GET /api/historias/mias (diagnóstico, tratamiento y notas por cita atendida). */
export function HistorialTab({ entries, loading, error, onRetry, onReserve }: Props) {
  if (loading) return <HistorialSkeleton />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (entries.length === 0) return <EmptyState onReserve={onReserve} />;

  return (
    <div id="panel-historial" role="tabpanel" aria-labelledby="tab-historial" className="p-4 space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slatey-100" aria-hidden="true" />
        <div className="space-y-4 pl-11">
          {entries.map((h, idx) => (
            <motion.div key={h.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(idx, 8) * 0.04 }} className="relative">
              <div className="absolute -left-7 top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary-500" aria-hidden="true" />
              <div className="rounded-2xl border border-primary-100 bg-primary-50 p-3.5 space-y-2.5">
                <div>
                  <p className="text-xs font-bold text-slatey-800 leading-tight">{h.servicio}</p>
                  <p className="text-[11px] text-slatey-400 mt-0.5">{h.odontologo} · {diaLima(h.fechaCita)} · {horaLima(h.fechaCita)}</p>
                </div>
                <Bloque icon={<Stethoscope className="w-3 h-3" />} titulo="Diagnóstico" texto={h.diagnostico} />
                <Bloque icon={<Pill className="w-3 h-3" />} titulo="Tratamiento" texto={h.tratamiento} />
                {h.notas && <Bloque icon={<FileText className="w-3 h-3" />} titulo="Notas" texto={h.notas} />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bloque({ icon, titulo, texto }: { icon: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-bold text-primary-600 uppercase tracking-wide">{icon} {titulo}</p>
      <p className="text-xs text-slatey-600 leading-relaxed mt-0.5 whitespace-pre-wrap">{texto}</p>
    </div>
  );
}
