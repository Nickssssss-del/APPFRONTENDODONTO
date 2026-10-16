import { Check } from 'lucide-react';
import type { PayMethod } from './types';

interface Props {
  value: PayMethod;
  onChange: (m: PayMethod) => void;
  disabled?: boolean;
}

const OPTIONS: { id: PayMethod; label: string; emoji: string; sub: string }[] = [
  { id: 'yape', label: 'Yape', emoji: '🟣', sub: 'QR desde la app' },
  { id: 'plin', label: 'Plin', emoji: '🟢', sub: 'QR desde la app' },
  { id: 'card', label: 'Tarjeta', emoji: '💳', sub: 'Visa · MC · Amex' },
];

export function MethodSelector({ value, onChange, disabled }: Props) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slatey-900 mb-3 px-0.5">
        ¿Cómo quieres pagar?
      </h3>
      <div className="grid grid-cols-3 gap-2.5">
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              disabled={disabled}
              aria-pressed={selected}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                selected
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-slatey-200 bg-white hover:border-slatey-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selected && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
              <span className="text-2xl leading-none">{opt.emoji}</span>
              <span
                className={`text-sm font-bold ${
                  selected ? 'text-primary-700' : 'text-slatey-800'
                }`}
              >
                {opt.label}
              </span>
              <span className="text-[10px] text-slatey-400 text-center leading-tight">
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

