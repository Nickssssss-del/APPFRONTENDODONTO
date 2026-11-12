import { api } from './http';

export type TipoDocumento = 'DNI' | 'TITULO_PROFESIONAL' | 'COLEGIATURA' | 'CV';

export type FotoConsultorio = { id: string; url: string; descripcion?: string; orden: number };
/** urlTemporal vence en urlExpiraEn (10 min). NO la pases por cld() ni la guardes: vuelve a pedir la lista. */
export type DocumentoOdontologo = { id: string; tipo: TipoDocumento; subidoEn: string; urlTemporal: string; urlExpiraEn: string };

const MAX_BYTES = 5 * 1024 * 1024; // el backend rechaza > 5 MB con 413
/** Tope de lo que se acepta del teléfono ANTES de comprimir (una foto de 48 MP ronda 8-15 MB). */
const MAX_BYTES_ORIGINAL = 25 * 1024 * 1024;
/** Por encima de esto se comprime: lado mayor 1920 px, JPEG 85 %. Basta para perfil y galería. */
const COMPRIMIR_DESDE = 1.5 * 1024 * 1024;
const LADO_MAXIMO = 1920;
const CALIDAD_JPEG = 0.85;
export const IMAGENES_PERMITIDAS = ['image/jpeg', 'image/png', 'image/webp'];

const EXTENSION_A_FORMATO: Record<string, 'jpeg' | 'png' | 'webp'> = {
  jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp',
};
const TIPO: Record<'jpeg' | 'png' | 'webp', string> = {
  jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
};
const EXTENSION: Record<'jpeg' | 'png' | 'webp', string> = {
  jpeg: 'jpg', png: 'png', webp: 'webp',
};

function extensionDe(nombre: string): string {
  const base = nombre.split(/[/\\]/).pop() ?? nombre;
  const punto = base.lastIndexOf('.');
  return punto >= 0 ? base.slice(punto + 1).toLowerCase() : '';
}

function formatoPorBytes(buf: Uint8Array): 'jpeg' | 'png' | 'webp' | 'heic' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
    && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'webp';
  if (buf.length >= 12 && String.fromCharCode(buf[4], buf[5], buf[6], buf[7]) === 'ftyp') {
    const marca = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]).toLowerCase();
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heif'].includes(marca)) return 'heic';
  }
  return null;
}

/**
 * El selector de Android 13 a menudo deja `file.type` vacío y `file.name` sin extensión
 * (o informa `image/jpg`). La firma de los primeros bytes identifica JPG, PNG y WEBP.
 * HEIC se rechaza aunque el nombre termine en .jpg.
 */
async function formatoDe(file: File): Promise<'jpeg' | 'png' | 'webp' | 'heic' | null> {
  const tipo = file.type.trim().toLowerCase();
  const extension = extensionDe(file.name);
  if (tipo === 'image/heic' || tipo === 'image/heif' || extension === 'heic' || extension === 'heif') return 'heic';
  const cabecera = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const porBytes = formatoPorBytes(cabecera);
  if (porBytes === 'heic') return 'heic';
  // Solo cuentan los bytes, igual que en el backend (ArchivoService.detectarFormato): un MIME o una extensión
  // de imagen sobre otro contenido (p. ej. un .html renombrado a .jpg) el servidor lo rechazaría igual.
  return porBytes;
}

/**
 * Valida en el cliente para no gastar una subida que el backend va a rechazar.
 * El servidor sigue comprobando los bytes reales.
 */
export async function validarImagen(file: File): Promise<string | null> {
  if (file.size <= 0) return 'No se pudo leer la imagen seleccionada.';
  const formato = await formatoDe(file);
  if (formato === 'heic') return 'HEIC no es compatible. Elige una imagen JPG, PNG o WEBP.';
  if (!formato) return 'Usa una imagen JPG, PNG o WEBP.';
  // Las fotos grandes se comprimen antes de subir (archivoParaSubir). Sin compresión disponible, el límite es 5 MB.
  const limite = puedeComprimir() ? MAX_BYTES_ORIGINAL : MAX_BYTES;
  if (file.size > limite) return `La imagen supera los ${Math.round(limite / 1024 / 1024)} MB.`;
  return null;
}

/**
 * Copia SIEMPRE los bytes a un File en memoria, con nombre y MIME que el multipart nativo pueda describir.
 * En Android, CapacitorHttp debe leer el archivo para armar el multipart; con el File original del selector
 * (respaldado por el sistema de archivos) esa lectura puede fallar o enviar la parte vacía.
 */
async function archivoParaSubir(file: File): Promise<File> {
  const formato = await formatoDe(file);
  const base = (file.name.split(/[/\\]/).pop() ?? '').trim();
  if (formato !== 'jpeg' && formato !== 'png' && formato !== 'webp') {
    return new File([await file.arrayBuffer()], base || 'archivo', { type: file.type, lastModified: file.lastModified });
  }
  if (file.size > COMPRIMIR_DESDE) {
    const comprimida = await comprimirImagen(file, base);
    if (comprimida) return comprimida;
  }
  const name = EXTENSION_A_FORMATO[extensionDe(base)] ? base : `foto.${EXTENSION[formato]}`;
  return new File([await file.arrayBuffer()], name, { type: TIPO[formato], lastModified: file.lastModified });
}

function puedeComprimir(): boolean {
  return typeof createImageBitmap === 'function' && typeof document !== 'undefined';
}

/**
 * Reduce la foto (lado mayor 1920 px) y la guarda como JPEG 85 %. Devuelve null si el dispositivo no puede
 * decodificarla o si el resultado no mejora: entonces se sube la original y el backend aplica su límite de 5 MB.
 */
export async function comprimirImagen(file: File, nombre = file.name): Promise<File | null> {
  if (!puedeComprimir()) return null;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff'; // PNG con transparencia → fondo blanco en JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', CALIDAD_JPEG));
    if (!blob || blob.size >= file.size) return null;
    const base = nombre.replace(/\.[^.]*$/, '') || 'foto';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return null;
  }
}

/** PDF o imagen para los documentos de verificación (también se copia a memoria). */
async function documentoParaSubir(file: File): Promise<File> {
  const cabecera = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const esPdf = String.fromCharCode(...cabecera) === '%PDF-';
  if (!esPdf) return archivoParaSubir(file);
  const base = (file.name.split(/[/\\]/).pop() ?? '').trim();
  const name = extensionDe(base) === 'pdf' ? base : 'documento.pdf';
  return new File([await file.arrayBuffer()], name, { type: 'application/pdf', lastModified: file.lastModified });
}

export const subirFotoPerfil = async (archivo: File) => {
  const listo = await archivoParaSubir(archivo);
  const form = new FormData();
  form.append('archivo', listo);
  return api<{ fotoPerfilUrl: string }>('/api/usuarios/yo/foto', { method: 'PUT', form });
};

export const listarFotosConsultorio = () => api<FotoConsultorio[]>('/api/odontologos/yo/fotos');

export const agregarFotoConsultorio = async (archivo: File, descripcion?: string) => {
  const listo = await archivoParaSubir(archivo);
  const form = new FormData();
  form.append('archivo', listo);
  if (descripcion) form.append('descripcion', descripcion);
  return api<FotoConsultorio>('/api/odontologos/yo/fotos', { method: 'POST', form });
};

export const eliminarFotoConsultorio = (id: string) => api(`/api/odontologos/yo/fotos/${id}`, { method: 'DELETE' });

export const listarDocumentos = () => api<DocumentoOdontologo[]>('/api/odontologos/yo/documentos');

export const subirDocumento = async (tipo: TipoDocumento, archivo: File) => {
  const listo = await documentoParaSubir(archivo);
  const form = new FormData();
  form.append('archivo', listo);
  // "tipo" es @RequestParam: va en la query, no en el form.
  return api<DocumentoOdontologo>('/api/odontologos/yo/documentos', { method: 'POST', form, query: { tipo } });
};
