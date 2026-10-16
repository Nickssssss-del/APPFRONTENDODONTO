/** Skeleton block — reusable pulse placeholder */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slatey-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Full-section skeleton for the Resumen tab */
export function ResumenSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-label="Cargando resumen…" aria-busy="true">
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

/** Skeleton for the Historial tab */
export function HistorialSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-label="Cargando historial…" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-2 flex-shrink-0 rounded-full" style={{ minHeight: '80px' } as React.CSSProperties} />
          <Skeleton className="flex-1 h-20" />
        </div>
      ))}
    </div>
  );
}

/** Empty state for new patients with zero history */
export function EmptyState({ onReserve }: { onReserve: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-5">
        <span className="text-4xl" aria-hidden="true">🦷</span>
      </div>
      <h3 className="text-lg font-bold text-slatey-900 font-display mb-2">
        ¡Aún no tienes historial!
      </h3>
      <p className="text-sm text-slatey-500 max-w-xs leading-relaxed mb-6">
        Cuando reserves tu primera cita y el odontólogo te atienda, aquí verás
        tu historia clínica completa.
      </p>
      <button
        onClick={onReserve}
        className="inline-flex items-center gap-2 bg-primary-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-sm shadow-primary-500/30 hover:bg-primary-600 transition-colors"
      >
        Reservar mi primera cita
      </button>
    </div>
  );
}

/** Generic error state with retry */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center mb-4">
        <span className="text-3xl" aria-hidden="true">⚠️</span>
      </div>
      <h3 className="text-base font-bold text-slatey-900 mb-1">
        No se pudo cargar la información
      </h3>
      <p className="text-sm text-slatey-500 mb-5">Revisa tu conexión e inténtalo de nuevo.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 border-2 border-slatey-200 text-slatey-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:border-primary-400 hover:text-primary-600 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}

