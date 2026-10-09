import { api } from './http';
import type { DentistLocation, ServiceItem } from '@/types';

/**
 * Catálogo REAL del backend (rama feature/chatbot-recordatorios).
 * Son públicos (sin sesión): GET /api/odontologos, /api/odontologos/{id}, /api/odontologos/{id}/disponibilidad
 * y /api/catalogos/**. Las claves llegan en snake_case y http.ts las convierte a camelCase.
 */

/* ───────── tipos (espejo de OdontologoDtos.java / CitaDtos.java) ───────── */
export type ItemCatalogo = { id: number; nombre: string };

export type OdontologoTarjeta = {
  id: string;
  nombre: string;
  fotoUrl?: string | null;
  consultorio?: string | null;
  distrito?: string | null;
  calificacion?: number | null;
  totalResenas?: number | null;
  especialidades: string[];
  precioDesde?: number | null;
  /** Solo viene cuando buscas "cerca de mí" (lat/lng). */
  distanciaKm?: number | null;
};

export type Pagina<T> = { contenido: T[]; pagina: number; tamano: number; totalElementos: number; totalPaginas: number };

export type ServicioApi = {
  id: string;
  categoriaId: number;
  categoria: string;
  titulo: string;
  descripcion?: string | null;
  precioTotal: number;
  /** Lo calcula el backend; no lo recalcules en el cliente. */
  montoDeposito: number;
  duracionMinutos: number;
  activo: boolean;
};

export type HorarioApi = { diaSemana: string; horaInicio: string; horaFin: string; intervaloMinutos?: number | null };
export type FotoConsultorioApi = { id: string; url: string; descripcion?: string | null; orden: number };

export type PerfilPublico = {
  id: string;
  nombre: string;
  fotoUrl?: string | null;
  consultorio?: string | null;
  direccion?: string | null;
  distrito?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  numeroColegiatura: string;
  colegiaturaVerificada: boolean;
  calificacion?: number | null;
  totalResenas?: number | null;
  requiereConfirmacionManual: boolean;
  especialidades: ItemCatalogo[];
  servicios: ServicioApi[];
  horarios: HorarioApi[];
  fotos: FotoConsultorioApi[];
};

export type Turno = { inicio: string; fin: string };
export type Disponibilidad = {
  odontologoId: string;
  servicioId: string;
  fecha: string;
  zonaHoraria: string;
  duracionMinutos: number;
  turnos: Turno[];
};

export type FiltrosOdontologos = {
  distrito?: string;
  especialidadId?: number;
  categoriaId?: number;
  q?: string;
  lat?: number;
  lng?: number;
  radioKm?: number;
  orden?: string;
  pagina?: number;
  tamano?: number;
};

/* ───────── llamadas ───────── */
export const buscarOdontologos = (f: FiltrosOdontologos = {}, signal?: AbortSignal) =>
  api<Pagina<OdontologoTarjeta>>('/api/odontologos', { auth: false, query: f, signal });

export const obtenerOdontologo = (id: string, signal?: AbortSignal) =>
  api<PerfilPublico>(`/api/odontologos/${id}`, { auth: false, signal });

/** `fecha` en formato AAAA-MM-DD. Los turnos vienen con zona horaria (ej. 2026-10-20T09:00:00-05:00): reenvía `inicio` tal cual al reservar. */
export const obtenerDisponibilidad = (odontologoId: string, servicioId: string, fecha: string, signal?: AbortSignal) =>
  api<Disponibilidad>(`/api/odontologos/${odontologoId}/disponibilidad`, { auth: false, query: { servicioId, fecha }, signal });

export const listarEspecialidades = () => api<ItemCatalogo[]>('/api/catalogos/especialidades', { auth: false });
export const listarCategorias = () => api<ItemCatalogo[]>('/api/catalogos/categorias-servicio', { auth: false });
export const listarDistritos = () => api<string[]>('/api/catalogos/distritos', { auth: false });

/* ───────── adaptadores a los tipos que ya usa tu UI ───────── */
export function toDentistLocation(o: OdontologoTarjeta): DentistLocation {
  return {
    id: o.id,
    name: o.nombre,
    specialty: o.especialidades[0] ?? 'Odontología General',
    rating: Number(o.calificacion ?? 0),
    reviews: o.totalResenas ?? 0,
    cop: '',
    address: o.consultorio ?? '',
    district: o.distrito ?? undefined,
    lat: 0,
    lng: 0,
    image: o.fotoUrl ?? '',
    price: Number(o.precioDesde ?? 0),
  };
}

export function toServiceItem(s: ServicioApi, imageUrl?: string | null, dentistName?: string): ServiceItem {
  return {
    id: s.id,
    title: s.titulo,
    description: s.descripcion ?? '',
    category: s.categoria,
    priceTotal: Number(s.precioTotal),
    durationMin: s.duracionMinutos,
    imageUrl: imageUrl ?? null,
    dentistName,
    depositAmount: Number(s.montoDeposito),
  };
}
