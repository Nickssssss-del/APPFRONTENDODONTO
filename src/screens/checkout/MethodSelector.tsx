import { Check, CreditCard, Smartphone, type LucideIcon } from 'lucide-react';
import type { MetodoDisponible } from '@/api/citas';
import type { PayMethod } from './types';
import { estadoMetodo } from './metodos';

interface Props {
  value: PayMethod;
  onChange: (m: PayMethod) => void;
  disabled?: boolean;
  /** Métodos que publica GET /api/public/pagos/config (p. ej. PLIN deshabilitado con nota "Próximamente"). */
  metodos?: MetodoDisponible[] | null;
}

const OPTIONS: { id: PayMethod; label: string; Icon: LucideIcon; color: string; sub: string }[] = [
  { id: 'yape', label: 'Yape', Icon: Smartphone, color: 'text-[#6B21A8]', sub: 'QR desde la app' },
  { id: 'plin', label: 'Plin', Icon: Smartphone, color: 'text-[#1D7D3A]', sub: 'QR desde la app' },
  { id: 'card', label: 'Tarjeta', Icon: CreditCard, color: 'text-primary-600', sub: 'Visa · MC · Amex' },
];

export function MethodSelector({ value, onChange, disabled, metodos }: Props) {
  return (
    <div role="group" aria-labelledby="titulo-metodo">
      <h3 id="titulo-metodo" className="text-sm font-bold text-slatey-900 mb-3 px-0.5">
        ¿Cómo quieres pagar?
      </h3>
      <div className="grid grid-cols-3 gap-2.5">
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          const { disponible, nota } = estadoMetodo(metodos, opt.id);
          const bloqueado = disabled || !disponible;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              disabled={bloqueado}
              aria-pressed={selected}
              className={`relative flex min-h-[44px] flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                selected
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-slatey-200 bg-white hover:border-slatey-300'
              } ${bloqueado ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {selected && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center" aria-hidden="true">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
              <opt.Icon className={`h-6 w-6 ${opt.color}`} aria-hidden="true" />
              <span className={`text-sm font-bold ${selected ? 'text-primary-700' : 'text-slatey-800'}`}>{opt.label}</span>
              <span className="text-[10px] text-slatey-500 text-center leading-tight">{disponible ? opt.sub : nota ?? 'No disponible'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
