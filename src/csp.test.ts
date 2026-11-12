import { describe, expect, it } from 'vitest';
import { POLITICA_CSP } from '../csp';

const directiva = (nombre: string) => POLITICA_CSP.split('; ').find((d) => d.startsWith(`${nombre} `)) ?? '';

describe('Content-Security-Policy', () => {
  it('no permite scripts en línea ni eval', () => {
    expect(directiva('script-src')).not.toContain("'unsafe-inline'");
    expect(directiva('script-src')).not.toContain("'unsafe-eval'");
  });

  it('bloquea plugins y cambios de base', () => {
    expect(directiva('object-src')).toBe("object-src 'none'");
    expect(directiva('base-uri')).toBe("base-uri 'self'");
  });

  it('permite lo que la app usa: Google Fonts, Mercado Pago, Google y mapas', () => {
    expect(directiva('style-src')).toContain('https://fonts.googleapis.com');
    expect(directiva('font-src')).toContain('https://fonts.gstatic.com');
    expect(directiva('script-src')).toContain('https://*.mercadopago.com');
    expect(directiva('script-src')).toContain('https://accounts.google.com');
    expect(directiva('img-src')).toContain('https:');
  });
});
