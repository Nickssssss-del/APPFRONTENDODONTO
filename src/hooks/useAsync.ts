import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api/http';

type State<T> = { data: T | null; loading: boolean; error: string | null };

/**
 * Carga datos del backend con los 3 estados que toda lista necesita (cargando / error / datos).
 * Cancela la petición si el componente se desmonta o cambian las dependencias.
 *
 *   const { data, loading, error, reload } = useAsync((signal) => listarServicios({ categoria }, signal), [categoria]);
 */
export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current(ctrl.signal).then(
      (data) => !ctrl.signal.aborted && setState({ data, loading: false, error: null }),
      (e: unknown) => {
        if (ctrl.signal.aborted || (e as Error).name === 'AbortError') return;
        setState({ data: null, loading: false, error: e instanceof ApiError ? e.message : 'No se pudo cargar la información' });
      },
    );
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
