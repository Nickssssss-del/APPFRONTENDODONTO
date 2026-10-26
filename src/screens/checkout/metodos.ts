import type { MetodoDisponible } from '@/api/citas';
import type { PayMethod } from './types';

const API: Record<PayMethod, MetodoDisponible['metodo']> = { yape: 'YAPE', plin: 'PLIN', card: 'TARJETA' };

/** Estado de un método según la configuración del backend (sin configuración: disponible). */
export function estadoMetodo(metodos: MetodoDisponible[] | null | undefined, id: PayMethod) {
  const m = metodos?.find((x) => x.metodo === API[id]);
  return { disponible: m ? m.disponible : true, nota: m?.nota ?? null };
}

