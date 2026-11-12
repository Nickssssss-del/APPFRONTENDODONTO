import { describe, expect, it } from 'vitest';
import { urlComoLlegar } from './rutas';

describe('urlComoLlegar', () => {
  it('usa coordenadas de origen y destino', () => {
    const url = new URL(urlComoLlegar({ latitud: -12.11, longitud: -77.02 }, { lat: -12.12, lng: -77.03 })!);
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('origin')).toBe('-12.12,-77.03');
    expect(url.searchParams.get('destination')).toBe('-12.11,-77.02');
  });

  it('sin ubicación del paciente deja que Google Maps use la del teléfono', () => {
    const url = new URL(urlComoLlegar({ latitud: -12.11, longitud: -77.02 }, null)!);
    expect(url.searchParams.has('origin')).toBe(false);
  });

  it('sin coordenadas válidas del consultorio usa su dirección', () => {
    const url = new URL(urlComoLlegar({ latitud: 0, longitud: 0, consultorio: 'Sonrisa', direccion: 'Av. Uno 100', distrito: 'Miraflores' })!);
    expect(url.searchParams.get('destination')).toBe('Sonrisa Av. Uno 100 Miraflores Lima');
  });

  it('sin coordenadas ni dirección no genera enlace', () => {
    expect(urlComoLlegar({})).toBeNull();
  });
});

import { afterEach as despues, vi } from 'vitest';
import { obtenerRuta, resumenRuta } from './rutas';

describe('obtenerRuta (OSRM)', () => {
  despues(() => { vi.unstubAllGlobals(); });

  it('pide la ruta en auto y convierte GeoJSON [lng,lat] a [lat,lng]', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'Ok',
      routes: [{ distance: 2345, duration: 480, geometry: { coordinates: [[-77.03, -12.12], [-77.025, -12.115], [-77.02, -12.11]] } }],
    })));
    vi.stubGlobal('fetch', fetchFalso);
    const r = await obtenerRuta({ lat: -12.12, lng: -77.03 }, { lat: -12.11, lng: -77.02 });
    expect(String(fetchFalso.mock.calls[0][0])).toContain('/route/v1/driving/-77.03,-12.12;-77.02,-12.11?overview=full&geometries=geojson');
    expect(r.puntos[0]).toEqual([-12.12, -77.03]);
    expect(r.puntos).toHaveLength(3);
    expect(resumenRuta(r)).toBe('2.3 km · 8 min');
  });

  it('falla si el servicio no encuentra ruta o responde con error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'NoRoute', routes: [] }))));
    await expect(obtenerRuta({ lat: 0.1, lng: 0.1 }, { lat: 0.2, lng: 0.2 })).rejects.toThrow('No se encontró una ruta');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x', { status: 429 })));
    await expect(obtenerRuta({ lat: 0.1, lng: 0.1 }, { lat: 0.2, lng: 0.2 })).rejects.toThrow('HTTP 429');
  });

  it('resume rutas largas en horas', () => {
    expect(resumenRuta({ distanciaM: 52000, duracionS: 4500 })).toBe('52.0 km · 1 h 15 min');
  });
});
