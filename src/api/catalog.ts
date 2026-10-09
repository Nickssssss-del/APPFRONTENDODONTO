import { api } from './http';
import type { DentistLocation, ServiceItem } from '@/types';

/**
 * ⚠ CONTRATO PENDIENTE EN EL BACKEND
 * Estos endpoints todavía NO existen en Spring Boot (hoy solo hay auth, archivos y chatbot).
 * Van bajo /api/public/** porque SecurityConfig ya lo deja abierto (permitAll): el paciente puede
 * explorar odontólogos y servicios antes de iniciar sesión. Ver el informe de integración para el detalle.
 */

/* ── lo que el backend debe devolver (snake_case en el cable; aquí ya en camelCase) ── */
export type OdontologoListItemDto = {
  id: string;
  nombreCompleto: string;
  fotoPerfilUrl?: string | null;
  nombreConsultorio?: string | null;
  direccionConsultorio?: string | null;
  distritoConsultorio?: string | null;
  latitudConsultorio?: number | null;
  longitudConsultorio?: number | null;
  calificacionPromedio: number;
  totalResenas: number;
  numeroColegiatura: string;
  colegiaturaVerificada: boolean;
  especialidades: string[];
  /** Precio más bajo entre sus servicios activos. */
  precioDesde?: number | null;
};

export type ServicioDto = {
  id: string;
  odontologoId: string;
  odontologoNombre?: string;
  categoria: string;
  titulo: string;
  descripcion?: string | null;
  precioTotal: number;
  /** El backend lo recalcula con un trigger: úsalo tal cual, no calcules el 20 % en el cliente. */
  montoDeposito: number;
  duracionMinutos: number;
  imagenUrl?: string | null;
};

export type Page<T> = { contenido: T[]; pagina: number; totalPaginas: number; totalElementos: number };

export type OdontologoFiltros = { distrito?: string; especialidad?: string; q?: string; pagina?: number; tamano?: number };
export type ServicioFiltros = { categoria?: string; odontologoId?: string; q?: string; pagina?: number; tamano?: number };

export const listarOdontologos = (f: OdontologoFiltros = {}, signal?: AbortSignal) =>
  api<Page<OdontologoListItemDto>>('/api/public/odontologos', { auth: false, query: f, signal });

export const listarServicios = (f: ServicioFiltros = {}, signal?: AbortSignal) =>
  api<Page<ServicioDto>>('/api/public/servicios', { auth: false, query: f, signal });

/* ── adaptadores: del contrato del backend a los tipos que ya usa tu UI ── */

export function toServiceItem(s: ServicioDto): ServiceItem {
  return {
    id: s.id,
    title: s.titulo,
    description: s.descripcion ?? '',
    category: s.categoria,
    priceTotal: s.precioTotal,
    durationMin: s.duracionMinutos,
    imageUrl: s.imagenUrl,
    dentistName: s.odontologoNombre,
    depositAmount: s.montoDeposito,
  };
}

export function toDentistLocation(o: OdontologoListItemDto): DentistLocation {
  return {
    id: o.id,
    name: o.nombreCompleto,
    specialty: o.especialidades[0] ?? 'Odontología General',
    rating: o.calificacionPromedio,
    reviews: o.totalResenas,
    cop: o.numeroColegiatura,
    address: o.direccionConsultorio ?? '',
    district: o.distritoConsultorio ?? undefined,
    lat: o.latitudConsultorio ?? 0,
    lng: o.longitudConsultorio ?? 0,
    image: o.fotoPerfilUrl ?? '',
    price: o.precioDesde ?? 0,
  };
}
