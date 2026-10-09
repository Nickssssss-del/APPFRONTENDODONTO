import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import type { ClinicalEntry } from '@/types';
import type { EntryType } from './types';
import { HistorialSkeleton, EmptyState, ErrorState } from './States';

interface Props {
  entries: ClinicalEntry[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onReserve: () => void;
}

const TYPE_META: Record<EntryType, { label: string; emoji: string; color: string; dot: string }> = {
  evolution:    { label: 'Evolución',    emoji: '📝', color: 'bg-primary-50 border-primary-100',  dot: 'bg-primary-500' },
  odontogram:   { label: 'Odontograma', emoji: '🦷', color: 'bg-teal-50 border-teal-100',         dot: 'bg-teal-500'    },
  xray:         { label: 'Radiografía', emoji: '🔬', color: 'bg-slatey-50 border-slatey-200',      dot: 'bg-slatey-500'  },
  tomography:   { label: 'Tomografía',  emoji: '🖥️', color: 'bg-indigo-50 border-indigo-100',     dot: 'bg-indigo-500'  },
  prescription: { label: 'Receta',      emoji: '💊', color: 'bg-success-50 border-success-100',   dot: 'bg-success-500' },
};

const ALL_TYPES: EntryType[] = ['evolution', 'odontogram', 'xray', 'tomography', 'prescription'];

export function HistorialTab({ entries, loading, error, onRetry, onReserve }: Props) {
  const [filter, setFilter] = useState<EntryType | 'all'>('all');
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.type === filter);

  const openViewer = useCallback((images: string[], index: number) => {
    setViewer({ images, index });
  }, []);

  const closeViewer = () => setViewer(null);
  const prev = () => setViewer((v) => v ? { ...v, index: Math.max(0, v.index - 1) } : v);
  const next = () => setViewer((v) => v ? { ...v, index: Math.min(v.images.length - 1, v.index + 1) } : v);

  if (loading) return <HistorialSkeleton />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (entries.length === 0) return <EmptyState onReserve={onReserve} />;

  return (
    <div
      id="panel-historial"
      role="tabpanel"
      aria-labelledby="tab-historial"
      className="p-4 space-y-4"
    >
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" emoji="📂" />
        {ALL_TYPES.map((t) => (
          <FilterChip
            key={t}
            active={filter === t}
            onClick={() => setFilter(t)}
            label={TYPE_META[t].label}
            emoji={TYPE_META[t].emoji}
          />
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slatey-100" aria-hidden="true" />

        <div className="space-y-4 pl-11">
          {filtered.map((entry, idx) => {
            const meta = TYPE_META[entry.type];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div
                  className={`absolute -left-7 top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white ${meta.dot}`}
                  aria-hidden="true"
                />

                <div className={`rounded-2xl border p-3.5 ${meta.color}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg leading-none flex-shrink-0" aria-hidden="true">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slatey-800 leading-tight">{entry.title}</p>
                      <p className="text-[11px] text-slatey-400 mt-0.5">{entry.date} · {entry.time}</p>
                    </div>
                    <span className="flex-shrink-0 text-[10px] font-semibold text-slatey-400 bg-white/70 rounded-full px-2 py-0.5">
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-slatey-600 leading-relaxed">{entry.description}</p>

                  {/* Image thumbnails */}
                  {entry.attachments.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {entry.attachments.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => openViewer(entry.attachments, i)}
                          aria-label={`Ver imagen ${i + 1} de ${entry.attachments.length}`}
                          className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm hover:ring-primary-400 transition-all"
                        >
                          <SmartImage
                            src={url}
                            alt={`Imagen ${i + 1} – ${entry.title}`}
                            ratio="1/1"
                            fallback="treatment"
                            fit="contain"
                            widths={[128, 256]}
                            sizes="64px"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Full-screen image viewer */}
      <AnimatePresence>
        {viewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Visor de imagen clínica"
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') prev();
              if (e.key === 'ArrowRight') next();
              if (e.key === 'Escape') closeViewer();
            }}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
          >
            {/* Close */}
            <button
              onClick={closeViewer}
              aria-label="Cerrar visor"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Counter */}
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold">
              {viewer.index + 1} / {viewer.images.length}
            </p>

            {/* Image — object-contain so radiografías never get cropped */}
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={viewer.images[viewer.index]}
                alt={`Imagen ${viewer.index + 1}`}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            </div>

            {/* Navigation */}
            {viewer.images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  disabled={viewer.index === 0}
                  aria-label="Imagen anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={next}
                  disabled={viewer.index === viewer.images.length - 1}
                  aria-label="Imagen siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({ active, onClick, label, emoji }: { active: boolean; onClick: () => void; label: string; emoji: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        active
          ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
          : 'bg-white text-slatey-600 border-slatey-200 hover:border-primary-300'
      }`}
    >
      <span aria-hidden="true">{emoji}</span>
      {label}
    </button>
  );
}

