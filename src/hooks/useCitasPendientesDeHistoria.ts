import { useRef } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { agendaOdontologo, type CitaApi } from '@/api/citas';
import { tramosAgendaHaciaAtras } from '@/lib/format';

/** Tramos de 62 días que se revisan como máximo hacia atrás (≈ 1 año). */
export const MAX_TRAMOS_HISTORIA = 6;

export type BusquedaPendientes = {
  /** Citas COMPLETADAS del paciente, ya iniciadas, sin historia clínica. Sin duplicados, la más reciente primero. */
  citas: CitaApi[];
  /** Fecha más antigua revisada ('AAAA-MM-DD'). */
  revisadoDesde: string;
};

type Opciones = {
  /** Cuántas pendientes se esperan (citas atendidas − historias). null = desconocido: solo se revisa el primer tramo. */
  objetivo: number | null;
  /** citaId que ya tienen historia. */
  conHistoria: Set<string>;
  signal?: AbortSignal;
  maxTramos?: number;
  ahora?: Date;
  /** Inyectable para pruebas. */
  pedirAgenda?: (desde: string, hasta: string, signal?: AbortSignal) => Promise<CitaApi[]>;
};

const pedirAgendaPorDefecto = (desde: string, hasta: string) => agendaOdontologo(desde, hasta);

/**
 * Recorre la agenda hacia atrás en tramos válidos para el backend (≤ 62 días, sin solaparse) hasta encontrar
 * todas las citas atendidas sin historia o agotar `maxTramos`. Corta antes si ya encontró las esperadas.
 */
export async function buscarCitasPendientesDeHistoria(pacienteId: string, opciones: Opciones): Promise<BusquedaPendientes> {
  const {
    objetivo, conHistoria, signal, maxTramos = MAX_TRAMOS_HISTORIA, ahora = new Date(), pedirAgenda = pedirAgendaPorDefecto,
  } = opciones;
  const tramos = tramosAgendaHaciaAtras(objetivo === null ? 1 : maxTramos, ahora);
  const encontradas = new Map<string, CitaApi>();
  let revisadoDesde = tramos[0].desde;

  for (const tramo of tramos) {
    if (objetivo !== null && encontradas.size >= objetivo) break;
    const citas = await pedirAgenda(tramo.desde, tramo.hastaExclusivo, signal);
    revisadoDesde = tramo.desde;
    for (const c of citas ?? []) {
      if (c.paciente?.id !== pacienteId || c.estado !== 'COMPLETADA') continue;
      if (new Date(c.inicio).getTime() > ahora.getTime() || conHistoria.has(c.id)) continue;
      encontradas.set(c.id, c);
    }
  }

  const citas = [...encontradas.values()].sort((a, b) => b.inicio.localeCompare(a.inicio));
  return { citas, revisadoDesde };
}

/**
 * Hook de la ficha del paciente. Espera a `listo` (detalle e historias cargados) para conocer el objetivo.
 * Guardar una historia NO vuelve a consultar: la ficha la quita de la lista con su propio conjunto `conHistoria`.
 */
export function useCitasPendientesDeHistoria(
  pacienteId: string,
  { listo, objetivo, conHistoria }: { listo: boolean; objetivo: number | null; conHistoria: Set<string> },
) {
  const actual = useRef({ objetivo, conHistoria });
  actual.current = { objetivo, conHistoria };

  return useAsync<BusquedaPendientes | null>(
    (signal) => (listo
      ? buscarCitasPendientesDeHistoria(pacienteId, { ...actual.current, signal })
      : Promise.resolve(null)),
    [pacienteId, listo],
  );
}
