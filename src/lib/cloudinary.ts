/**
 * Helpers para servir imágenes de Cloudinary con el tamaño justo.
 *
 * Idea: la BD guarda la URL "cruda" (sin transformaciones) y el frontend decide
 * el recorte según el contexto (avatar 96px, tarjeta 4:3, galería 16:9...).
 * Si la URL NO es de Cloudinary (Pexels, placeholders, etc.) se devuelve igual,
 * así que se puede usar desde hoy sin romper nada.
 */

export type CldOptions = {
  /** Ancho en px (CSS px; dpr_auto se encarga de pantallas retina). */
  w?: number;
  h?: number;
  /** Relación de aspecto, ej. "4:3". Si se pasa junto con w, Cloudinary calcula h. */
  ar?: string;
  /** fill = recorta para llenar; limit = nunca agranda; fit = cabe completo. */
  crop?: 'fill' | 'limit' | 'fit' | 'thumb';
  /** auto = detecta lo importante; face = centra rostros (avatares). */
  gravity?: 'auto' | 'face' | 'center';
  /** Calidad. Por defecto q_auto. */
  q?: 'auto' | number;
  /** Para el placeholder borroso (LQIP). */
  blur?: number;
};

const UPLOAD_MARKER = '/image/upload/';

export function isCloudinaryUrl(url?: string | null): url is string {
  return !!url && url.includes('res.cloudinary.com') && url.includes(UPLOAD_MARKER);
}

export function cld(url: string | null | undefined, opts: CldOptions = {}): string {
  if (!url) return '';
  if (!isCloudinaryUrl(url)) return url;

  const { w, h, ar, crop = 'fill', gravity = 'auto', q = 'auto', blur } = opts;
  const parts: string[] = ['f_auto', `q_${q}`, 'dpr_auto', `c_${crop}`];
  if (crop === 'fill' || crop === 'thumb') parts.push(`g_${gravity}`);
  if (w) parts.push(`w_${Math.round(w)}`);
  if (h) parts.push(`h_${Math.round(h)}`);
  if (ar) parts.push(`ar_${ar}`);
  if (blur) parts.push(`e_blur:${blur}`);

  return url.replace(UPLOAD_MARKER, `${UPLOAD_MARKER}${parts.join(',')}/`);
}

/** srcset por anchos: "url 320w, url 480w, ..." (vacío si no es Cloudinary). */
export function cldSrcSet(
  url: string | null | undefined,
  widths: number[],
  opts: Omit<CldOptions, 'w'> = {},
): string | undefined {
  if (!isCloudinaryUrl(url)) return undefined;
  return widths.map((w) => `${cld(url, { ...opts, w })} ${w}w`).join(', ');
}
