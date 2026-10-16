import { useEffect, useRef, useState } from 'react';
import { Building2, ImageOff, Stethoscope, Sparkles } from 'lucide-react';
import { cld, cldSrcSet } from '@/lib/cloudinary';

type Fallback = 'avatar' | 'clinic' | 'treatment' | 'generic';

type SmartImageProps = {
  src?: string | null;
  alt: string;
  /** Relación de aspecto CSS del contenedor. Reserva el espacio ANTES de cargar → sin saltos de layout. */
  ratio?: '1/1' | '4/3' | '3/2' | '16/9' | '3/4' | (string & {});
  /** Qué mostrar si la imagen no existe o falla (URL rota, 404, sin red). */
  fallback?: Fallback;
  /** object-cover (recorta) o object-contain (radiografías: nunca recortar). */
  fit?: 'cover' | 'contain';
  /** Anchos candidatos para srcset (solo aplica a URLs de Cloudinary). */
  widths?: number[];
  /** Atributo sizes del <img>. Por defecto, el ancho del contenedor móvil. */
  sizes?: string;
  /** true para la imagen principal visible sin scroll (carga inmediata). */
  priority?: boolean;
  gravity?: 'auto' | 'face' | 'center';
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
};

const FALLBACK_ICON: Record<Fallback, typeof ImageOff> = {
  avatar: Stethoscope,
  clinic: Building2,
  treatment: Sparkles,
  generic: ImageOff,
};

function initials(text: string) {
  return text
    .replace(/^(dr\.?|dra\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/**
 * <img> robusto para datos reales:
 *  1. Reserva el espacio con aspect-ratio (el grid no "salta" al cargar).
 *  2. Muestra un skeleton y hace fade-in cuando la imagen llega.
 *  3. Si falla, muestra un fallback con identidad de marca (iniciales o ícono).
 *  4. Pide a Cloudinary el tamaño justo (srcset + f_auto + q_auto).
 */
export default function SmartImage({
  src,
  alt,
  ratio = '4/3',
  fallback = 'generic',
  fit = 'cover',
  widths = [160, 320, 480, 720],
  sizes = '(max-width: 448px) 100vw, 448px',
  priority = false,
  gravity = 'auto',
  className = '',
  imgClassName = '',
  onClick,
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
  const imgRef = useRef<HTMLImageElement>(null);

  // Si cambia la URL (p. ej. otro odontólogo), reinicia el estado.
  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  // Imágenes que ya estaban en caché no disparan onLoad de forma fiable.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setStatus('loaded');
  }, [src]);

  const Icon = FALLBACK_ICON[fallback];
  const showInitials = fallback === 'avatar' && initials(alt).length > 0;

  return (
    <div
      className={`relative overflow-hidden bg-slatey-100 ${className}`}
      style={{ aspectRatio: ratio }}
      onClick={onClick}
    >
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-slatey-200/70" aria-hidden />}

      {status === 'error' ? (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600"
        >
          {showInitials ? (
            <span className="font-display font-extrabold text-[clamp(0.9rem,28%,2rem)] leading-none">{initials(alt)}</span>
          ) : (
            <Icon className="w-1/4 h-1/4 min-w-5 min-h-5 opacity-70" aria-hidden />
          )}
        </div>
      ) : (
        <img
          ref={imgRef}
          src={cld(src, { w: widths[Math.min(1, widths.length - 1)], crop: fit === 'cover' ? 'fill' : 'fit', gravity })}
          srcSet={cldSrcSet(src, widths, { crop: fit === 'cover' ? 'fill' : 'fit', gravity })}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
            fit === 'cover' ? 'object-cover' : 'object-contain'
          } ${status === 'loaded' ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}
    </div>
  );
}
