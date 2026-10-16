import type { ProfileTab } from './types';

const TABS: { id: ProfileTab; label: string; emoji: string }[] = [
  { id: 'resumen',      label: 'Resumen',      emoji: '🏠' },
  { id: 'historial',   label: 'Historial',    emoji: '📋' },
  { id: 'odontograma', label: 'Odontograma',  emoji: '🦷' },
  { id: 'comprobantes',label: 'Comprobantes', emoji: '🧾' },
];

interface Props {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Secciones del perfil"
      className="sticky top-0 z-20 bg-white border-b border-slatey-100"
    >
      <div className="max-w-md mx-auto flex overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 px-2 py-3 text-[11px] font-bold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400 ${
                selected
                  ? 'text-primary-600 border-b-2 border-primary-500 -mb-px bg-primary-50/40'
                  : 'text-slatey-500 hover:text-slatey-700 border-b-2 border-transparent'
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">{tab.emoji}</span>
              <span className="truncate w-full text-center leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

