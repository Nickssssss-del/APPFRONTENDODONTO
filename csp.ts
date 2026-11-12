import type { Plugin } from 'vite';

/**
 * Content-Security-Policy de la app (WebView de Android y build web).
 * Solo se inyecta en `vite build`: en `vite dev` rompería los scripts en línea del recargado en caliente.
 *
 * Orígenes permitidos y por qué:
 *  - script: la app (self), inicio de sesión de Google (web) y el SDK de Mercado Pago (pago con tarjeta).
 *  - style/font: Google Fonts (src/index.css) y estilos en línea de React, Leaflet y framer-motion.
 *  - img: cualquier https (Cloudinary, mosaicos de OpenStreetMap, fotos de perfil) más data:/blob: (vistas previas).
 *  - connect: la API (VITE_API_URL, puede cambiar por entorno), Mercado Pago y Google; http local solo para pruebas.
 *  - frame: campos seguros de Mercado Pago y Google.
 *  - object-src 'none' y base-uri 'self' impiden inyectar plugins o cambiar la base de las rutas.
 */
const MERCADO_PAGO = ['https://*.mercadopago.com', 'https://*.mercadolibre.com', 'https://*.mercadolivre.com', 'https://*.mlstatic.com'];
const GOOGLE = ['https://accounts.google.com', 'https://apis.google.com'];

export const POLITICA_CSP = [
  "default-src 'self'",
  `script-src 'self' ${[...GOOGLE, ...MERCADO_PAGO].join(' ')}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${GOOGLE[0]}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: http://localhost:* http://10.0.2.2:*",
  `frame-src ${[...GOOGLE, ...MERCADO_PAGO].join(' ')}`,
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${MERCADO_PAGO.join(' ')}`,
].join('; ');

export function cspEnBuild(): Plugin {
  return {
    name: 'odonto-csp',
    apply: 'build',
    transformIndexHtml: (html) => html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${POLITICA_CSP}" />`,
    ),
  };
}
