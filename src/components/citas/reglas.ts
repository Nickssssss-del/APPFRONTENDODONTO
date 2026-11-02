import type { CitaApi } from '@/api/citas';

export const HORA = 3_600_000;

/* ───────── Reglas (las mismas que valida el backend) ───────── */

/** Una sola vez, hasta 24 h antes, si está CONFIRMADA o PENDIENTE_CONFIRMACION. */
export const puedeReprogramar = (c: CitaApi) =>
  (c.estado === 'CONFIRMADA' || c.estado === 'PENDIENTE_CONFIRMACION') &&
  !c.citaOrigenId &&
  new Date(c.inicio).getTime() - Date.now() >= 24 * HORA;

/** "¿Te atendieron?": desde 15 min después del inicio hasta 72 h después del fin. */
export const puedeResponderAsistencia = (c: CitaApi) => {
  if (c.estado !== 'CONFIRMADA') return false;
  const ahora = Date.now();
  return ahora >= new Date(c.inicio).getTime() + 15 * 60_000 && ahora <= new Date(c.fin).getTime() + 72 * HORA;
};

/** Hubo depósito pagado y la cita se canceló o terminó: puede haber reembolsos que consultar. */
export const puedeVerReembolsos = (c: CitaApi) =>
  c.estado === 'CANCELADA_CON_REEMBOLSO' || c.estado === 'CANCELADA_SIN_REEMBOLSO' || c.estado === 'COMPLETADA';

