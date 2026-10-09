import { motion } from 'framer-motion';
import { Clock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import type { ServiceItem } from '@/types';

/** 2160 → "S/ 2,160" · 49.5 → "S/ 49.50" (sin decimales si el monto es entero). */
export function formatPEN(amount: number) {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

type ServiceCardProps = {
  service: ServiceItem;
  onReserve: (service: ServiceItem) => void;
  /** Para animación escalonada al entrar en el grid. */
  index?: number;
};

/**
 * Tarjeta de tratamiento diseñada para contenido REAL y variable:
 *  - Imagen con relación fija 4:3 (cualquier foto se recorta igual, sin saltos).
 *  - Título y descripción con line-clamp (2 líneas máx.) dentro de un contenedor con altura
 *    mínima reservada → todas las tarjetas de una fila miden lo mismo y los botones quedan alineados.
 *  - Footer anclado abajo (mt-auto) aunque el texto sea corto.
 *  - `min-w-0` en los hijos flex para que el texto largo no ensanche la columna.
 */
export default function ServiceCard({ service, onReserve, index = 0 }: ServiceCardProps) {
  const rate = service.guaranteeRate ?? 0.2;
  const deposit = service.depositAmount ?? service.priceTotal * rate;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slatey-100 bg-white shadow-sm"
    >
      <div className="relative">
        <SmartImage
          src={service.imageUrl}
          alt={service.title}
          ratio="4/3"
          fallback="treatment"
          sizes="(max-width: 448px) 50vw, 224px"
          widths={[200, 320, 480]}
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-primary-700 shadow-sm backdrop-blur">
          {service.category}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        {/* El contenedor reserva 2 líneas; el clamp va en el hijo para que NUNCA asome una 3.ª línea. */}
        <div className="min-h-[2.4rem]">
          <h3
            title={service.title}
            className="line-clamp-2 break-words font-display text-sm font-bold leading-tight text-slatey-900"
          >
            {service.title}
          </h3>
        </div>
        <div className="mt-1 min-h-[2.1rem]">
          <p className="line-clamp-2 break-words text-xs leading-snug text-slatey-500">{service.description}</p>
        </div>

        <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slatey-500">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{formatDuration(service.durationMin)}</span>
        </div>

        {/* Footer anclado abajo */}
        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-base font-extrabold leading-none text-primary-600">
                {formatPEN(service.priceTotal)}
              </p>
              <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slatey-500">
                <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
                Garantía {formatPEN(deposit)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onReserve(service)}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-500 py-2.5 text-xs font-bold text-white shadow-sm shadow-primary-500/25 transition-all hover:bg-primary-600 active:scale-[0.97]"
            aria-label={`Reservar ${service.title}`}
          >
            Reservar
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slatey-100 bg-white" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-slatey-200/70" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-slatey-200/70" />
        <div className="h-3.5 w-3/5 animate-pulse rounded bg-slatey-200/70" />
        <div className="h-3 w-full animate-pulse rounded bg-slatey-100" />
        <div className="mt-3 h-5 w-1/3 animate-pulse rounded bg-slatey-200/70" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-slatey-200/70" />
      </div>
    </div>
  );
}

type ServiceGridProps = {
  items: ServiceItem[];
  loading?: boolean;
  onReserve: (service: ServiceItem) => void;
};

/** Grid 2 columnas en móvil. `items-stretch` + h-full en la tarjeta = filas parejas. */
export function ServiceGrid({ items, loading = false, onReserve }: ServiceGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 items-stretch gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slatey-200 bg-white px-6 py-10 text-center">
        <Sparkles className="mb-2 h-8 w-8 text-primary-400" aria-hidden />
        <p className="text-sm font-bold text-slatey-900">Aún no hay servicios publicados</p>
        <p className="mt-1 max-w-xs text-xs text-slatey-500">Este odontólogo todavía no ha cargado su catálogo.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 items-stretch gap-3">
      {items.map((s, i) => (
        <ServiceCard key={s.id} service={s} index={i} onReserve={onReserve} />
      ))}
    </div>
  );
}
