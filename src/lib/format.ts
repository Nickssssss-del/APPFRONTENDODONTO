/**
 * Fechas y dinero para la UI. El backend trabaja en America/Lima (UTC-5, sin horario de verano),
 * así que mostramos SIEMPRE en esa zona aunque el celular esté en otra.
 */
export const TZ = 'America/Lima';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

type Partes = { y: number; m: number; d: number; hh: number; mm: number; dow: number };

function partes(iso: string | Date): Partes {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(date);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? '0';
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: Number(get('year')), m: Number(get('month')), d: Number(get('day')),
    hh: Number(get('hour')) % 24, mm: Number(get('minute')), dow: dowMap[get('weekday')] ?? 0,
  };
}

const dos = (n: number) => String(n).padStart(2, '0');

/** "09:30" en hora de Lima. */
export function horaLima(iso: string): string {
  const p = partes(iso);
  return `${dos(p.hh)}:${dos(p.mm)}`;
}

/** "Mar 20 oct" en hora de Lima. */
export function diaLima(iso: string | Date): string {
  const p = partes(iso);
  return `${DIAS[p.dow]} ${p.d} ${MESES[p.m - 1]}`;
}

/** "2026-10-20" (fecha de Lima) para pedir disponibilidad o filtrar la agenda. */
export function fechaIsoLima(iso: string | Date): string {
  const p = partes(iso);
  return `${p.y}-${dos(p.m)}-${dos(p.d)}`;
}

/** Hoy + n días como [{ fecha: 'AAAA-MM-DD', etiqueta: 'Mar 20 oct', corto: 'Mar', numero: 20 }]. */
export function proximosDias(cantidad: number): { fecha: string; etiqueta: string; corto: string; numero: number }[] {
  const hoy = partes(new Date());
  const base = Date.UTC(hoy.y, hoy.m - 1, hoy.d, 12); // mediodía UTC: evita saltos por zona
  return Array.from({ length: cantidad }, (_, i) => {
    const d = new Date(base + i * 86_400_000);
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate(), dow = d.getUTCDay();
    return {
      fecha: `${y}-${dos(m + 1)}-${dos(day)}`,
      etiqueta: `${DIAS[dow]} ${day} ${MESES[m]}`,
      corto: DIAS[dow],
      numero: day,
    };
  });
}

/** Suma días a una fecha 'AAAA-MM-DD'. */
export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const r = new Date(Date.UTC(y, m - 1, d + dias, 12));
  return `${r.getUTCFullYear()}-${dos(r.getUTCMonth() + 1)}-${dos(r.getUTCDate())}`;
}

/**
 * Máximo de días que acepta GET /api/odontologos/yo/citas entre `desde` y `hasta` (exclusivo).
 * Regla del backend: CitaService.agenda → 400 «El rango de la agenda debe ser de 1 a 62 días».
 */
export const MAX_DIAS_RANGO_AGENDA = 62;

/** Días entre dos fechas 'AAAA-MM-DD' (b − a). */
export function diasEntre(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

/** true si el backend acepta el rango [desde, hastaExclusivo). */
export function rangoAgendaValido(desde: string, hastaExclusivo: string): boolean {
  const dias = diasEntre(desde, hastaExclusivo);
  return dias >= 1 && dias <= MAX_DIAS_RANGO_AGENDA;
}

/**
 * Ventana de la agenda del odontólogo: ayer + hoy + 60 días = 62 días, el máximo permitido.
 * Incluye ayer para poder marcar o revisar las citas del día anterior.
 */
export const AGENDA_DIAS_ANTES = 1;
export const AGENDA_DIAS_DESPUES = MAX_DIAS_RANGO_AGENDA - AGENDA_DIAS_ANTES - 1; // 60

export function rangoAgendaOdontologo(ahora = new Date()) {
  const hoy = fechaIsoLima(ahora);
  const desde = sumarDias(hoy, -AGENDA_DIAS_ANTES);
  const ultimo = sumarDias(hoy, AGENDA_DIAS_DESPUES);
  return { hoy, desde, ultimo, hastaExclusivo: sumarDias(ultimo, 1) };
}

/**
 * Tramos consecutivos hacia atrás, cada uno ≤ 62 días y sin solaparse (no generan duplicados).
 * El primero termina mañana (exclusivo), así que incluye hoy.
 */
export function tramosAgendaHaciaAtras(cantidad: number, ahora = new Date()): { desde: string; hastaExclusivo: string }[] {
  const tramos: { desde: string; hastaExclusivo: string }[] = [];
  let hasta = sumarDias(fechaIsoLima(ahora), 1);
  for (let i = 0; i < cantidad; i++) {
    const desde = sumarDias(hasta, -MAX_DIAS_RANGO_AGENDA);
    tramos.push({ desde, hastaExclusivo: hasta });
    hasta = desde;
  }
  return tramos;
}

export function diasAgendaOdontologo(ahora = new Date()) {
  const { desde, ultimo } = rangoAgendaOdontologo(ahora);
  const dias: { fecha: string; etiqueta: string; corto: string; numero: number }[] = [];
  for (let fecha = desde; fecha <= ultimo; fecha = sumarDias(fecha, 1)) {
    const [y, m, d] = fecha.split('-').map(Number);
    const etiqueta = diaLima(new Date(Date.UTC(y, m - 1, d, 12)));
    dias.push({ fecha, etiqueta, corto: etiqueta.split(' ')[0], numero: d });
  }
  return dias;
}

export const soles = (n: number | null | undefined) => `S/ ${Number(n ?? 0).toFixed(2)}`;

/** Segundos que faltan hasta `iso` (0 si ya pasó). */
export function segundosHasta(iso?: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

/** Etiquetas en español de los estados de cita del backend. */
export const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  PENDIENTE_CONFIRMACION: 'Esperando confirmación',
  CONFIRMADA: 'Confirmada',
  COMPLETADA: 'Atendida',
  CANCELADA_CON_REEMBOLSO: 'Cancelada (con reembolso)',
  CANCELADA_SIN_REEMBOLSO: 'Cancelada',
  INASISTENCIA_PENALIZADA: 'Inasistencia',
  REPROGRAMADA: 'Reprogramada',
};
