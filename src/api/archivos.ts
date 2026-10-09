import { api } from './http';

export type TipoDocumento = 'DNI' | 'TITULO_PROFESIONAL' | 'COLEGIATURA' | 'CV';

export type FotoConsultorio = { id: string; url: string; descripcion?: string; orden: number };
/** urlTemporal vence en urlExpiraEn (10 min). NO la pases por cld() ni la guardes: vuelve a pedir la lista. */
export type DocumentoOdontologo = { id: string; tipo: TipoDocumento; subidoEn: string; urlTemporal: string; urlExpiraEn: string };

const MAX_BYTES = 5 * 1024 * 1024; // el backend rechaza > 5 MB con 413
export const IMAGENES_PERMITIDAS = ['image/jpeg', 'image/png', 'image/webp'];

/** Valida en el cliente para no gastar una subida que el backend va a rechazar. */
export function validarImagen(file: File): string | null {
  if (!IMAGENES_PERMITIDAS.includes(file.type)) return 'Usa una imagen JPG, PNG o WEBP.';
  if (file.size > MAX_BYTES) return 'La imagen supera los 5 MB.';
  return null;
}

export const subirFotoPerfil = (archivo: File) => {
  const form = new FormData();
  form.append('archivo', archivo);
  return api<{ fotoPerfilUrl: string }>('/api/usuarios/yo/foto', { method: 'PUT', form });
};

export const listarFotosConsultorio = () => api<FotoConsultorio[]>('/api/odontologos/yo/fotos');

export const agregarFotoConsultorio = (archivo: File, descripcion?: string) => {
  const form = new FormData();
  form.append('archivo', archivo);
  if (descripcion) form.append('descripcion', descripcion);
  return api<FotoConsultorio>('/api/odontologos/yo/fotos', { method: 'POST', form });
};

export const eliminarFotoConsultorio = (id: string) => api(`/api/odontologos/yo/fotos/${id}`, { method: 'DELETE' });

export const listarDocumentos = () => api<DocumentoOdontologo[]>('/api/odontologos/yo/documentos');

export const subirDocumento = (tipo: TipoDocumento, archivo: File) => {
  const form = new FormData();
  form.append('archivo', archivo);
  // "tipo" es @RequestParam: va en la query, no en el form.
  return api<DocumentoOdontologo>('/api/odontologos/yo/documentos', { method: 'POST', form, query: { tipo } });
};
