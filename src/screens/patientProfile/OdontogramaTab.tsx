/**
 * OdontogramaTab — read-only dental chart view.
 *
 * The actual interactive Odontograma component lives in the dentist module
 * (src/screens/dentist/). Here we render a simplified read-only version
 * with the 32 permanent teeth laid out in FDI (ISO 3950) notation,
 * matching the structure used in the dentist panel.
 *
 * To reuse the dentist odontogram component, import it from its path and
 * pass `readOnly={true}` once that prop is supported.
 */

import { useState } from 'react';

type ToothStatus = 'healthy' | 'caries' | 'restored' | 'extracted' | 'crown';

interface Tooth {
  fdi: number;
  status: ToothStatus;
  note?: string;
}

const STATUS_COLORS: Record<ToothStatus, string> = {
  healthy:   'bg-white border-slatey-300 text-slatey-600',
  caries:    'bg-error-100 border-error-400 text-error-700',
  restored:  'bg-primary-100 border-primary-400 text-primary-700',
  extracted: 'bg-slatey-200 border-slatey-400 text-slatey-400 line-through',
  crown:     'bg-accent-100 border-accent-400 text-accent-700',
};

const STATUS_LABELS: Record<ToothStatus, string> = {
  healthy:   'Sana',
  caries:    'Caries',
  restored:  'Restaurada',
  extracted: 'Extraída',
  crown:     'Corona',
};

/** FDI quadrant layout: 18-11 | 21-28 (upper), 48-41 | 31-38 (lower) */
const UPPER_RIGHT: number[] = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT:  number[] = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT:  number[] = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_RIGHT: number[] = [31, 32, 33, 34, 35, 36, 37, 38];

/** Sample data — replace with API response when available */
const DEMO_TEETH: Tooth[] = [
  ...UPPER_RIGHT.map((fdi) => ({ fdi, status: 'healthy' as ToothStatus })),
  ...UPPER_LEFT.map((fdi, i) => ({
    fdi,
    status: (i === 4 ? 'caries' : i === 5 ? 'restored' : 'healthy') as ToothStatus,
    note: i === 4 ? 'Caries mesial' : i === 5 ? 'Composite' : undefined,
  })),
  ...LOWER_LEFT.map((fdi) => ({ fdi, status: 'healthy' as ToothStatus })),
  ...LOWER_RIGHT.map((fdi, i) => ({
    fdi,
    status: (i === 5 ? 'extracted' : 'healthy') as ToothStatus,
    note: i === 5 ? 'Exodoncia Ago/24' : undefined,
  })),
];

export function OdontogramaTab() {
  const [selected, setSelected] = useState<Tooth | null>(null);

  const toothMap = new Map(DEMO_TEETH.map((t) => [t.fdi, t]));
  const getTooth = (fdi: number): Tooth => toothMap.get(fdi) ?? { fdi, status: 'healthy' };

  return (
    <div
      id="panel-odontograma"
      role="tabpanel"
      aria-labelledby="tab-odontograma"
      className="p-4 space-y-4"
    >
      <div className="bg-white rounded-2xl border border-slatey-100 p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slatey-900">Odontograma — Solo lectura</h3>
          <span className="text-[11px] text-slatey-400">Notación FDI</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(STATUS_LABELS) as [ToothStatus, string][]).map(([st, lbl]) => (
            <span key={st} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_COLORS[st]}`}>
              {lbl}
            </span>
          ))}
        </div>

        {/* Upper arch */}
        <div>
          <p className="text-[10px] text-slatey-400 uppercase tracking-wide mb-2 text-center">Superior</p>
          <div className="flex justify-center gap-0.5">
            {[...UPPER_RIGHT, ...UPPER_LEFT].map((fdi) => {
              const t = getTooth(fdi);
              return (
                <ToothCell key={fdi} tooth={t} onSelect={setSelected} selected={selected?.fdi === fdi} />
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slatey-100" />

        {/* Lower arch */}
        <div>
          <div className="flex justify-center gap-0.5">
            {[...LOWER_LEFT.slice().reverse(), ...LOWER_RIGHT].map((fdi) => {
              const t = getTooth(fdi);
              return (
                <ToothCell key={fdi} tooth={t} onSelect={setSelected} selected={selected?.fdi === fdi} />
              );
            })}
          </div>
          <p className="text-[10px] text-slatey-400 uppercase tracking-wide mt-2 text-center">Inferior</p>
        </div>
      </div>

      {/* Detail popover */}
      {selected && (
        <div className="bg-white rounded-2xl border border-slatey-100 p-4 space-y-1">
          <p className="text-sm font-bold text-slatey-900">
            Pieza {selected.fdi}
          </p>
          <p className="text-xs text-slatey-600">
            Estado: <strong>{STATUS_LABELS[selected.status]}</strong>
          </p>
          {selected.note && (
            <p className="text-xs text-slatey-500">{selected.note}</p>
          )}
        </div>
      )}

      <p className="text-[11px] text-slatey-400 text-center">
        Solo tu odontólogo puede modificar el odontograma.
      </p>
    </div>
  );
}

function ToothCell({ tooth, onSelect, selected }: { tooth: Tooth; onSelect: (t: Tooth) => void; selected: boolean }) {
  return (
    <button
      onClick={() => onSelect(tooth)}
      aria-label={`Pieza ${tooth.fdi}: ${STATUS_LABELS[tooth.status]}`}
      aria-pressed={selected}
      className={`w-8 h-10 rounded-md border-2 text-[9px] font-bold flex flex-col items-center justify-end pb-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
        STATUS_COLORS[tooth.status]
      } ${selected ? 'ring-2 ring-primary-500 scale-110 z-10' : 'hover:scale-105'}`}
    >
      <span className="text-[8px] opacity-70">{tooth.fdi}</span>
    </button>
  );
}

