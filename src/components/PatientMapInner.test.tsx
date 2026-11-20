import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

// OBS-10: al girar el celular el mapa debe volver a encuadrar la ruta y los pines.

const mapa = vi.hoisted(() => {
  const contenedor = { clientWidth: 360, clientHeight: 280 };
  return {
    contenedor,
    llamadas: { invalidateSize: 0, fitBounds: 0, setView: 0 },
  };
});

vi.mock('react-leaflet', () => ({
  useMap: () => ({
    getContainer: () => mapa.contenedor,
    invalidateSize: () => { mapa.llamadas.invalidateSize++; },
    fitBounds: () => { mapa.llamadas.fitBounds++; },
    setView: () => { mapa.llamadas.setView++; },
  }),
  MapContainer: () => null,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  Polyline: () => null,
}));

import { EncuadreAlRedimensionar } from './PatientMapInner';

const ruta: [number, number][] = [[-14.07, -75.73], [-14.06, -75.72], [-14.05, -75.71]];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mapa.contenedor.clientWidth = 360;
  mapa.contenedor.clientHeight = 280;
  mapa.llamadas.invalidateSize = 0;
  mapa.llamadas.fitBounds = 0;
  mapa.llamadas.setView = 0;
});

describe('Mapa al girar el celular (OBS-10)', () => {
  it('vuelve a encuadrar la ruta cuando el contenedor cambia de tamaño', () => {
    vi.useFakeTimers();
    render(<EncuadreAlRedimensionar puntos={ruta} padding={36} maxZoom={16} />);

    // Horizontal: el contenedor pasa a ser más ancho que alto.
    mapa.contenedor.clientWidth = 780;
    mapa.contenedor.clientHeight = 220;
    window.dispatchEvent(new Event('orientationchange'));
    vi.advanceTimersByTime(200);

    expect(mapa.llamadas.invalidateSize).toBe(1);
    expect(mapa.llamadas.fitBounds).toBe(1);
  });

  it('no reencuadra si el tamaño no cambió (no pelea con el usuario al mover el mapa)', () => {
    vi.useFakeTimers();
    render(<EncuadreAlRedimensionar puntos={ruta} padding={36} maxZoom={16} />);
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(200);
    expect(mapa.llamadas.fitBounds).toBe(0);
  });

  it('con un solo punto centra el mapa en lugar de encuadrar', () => {
    vi.useFakeTimers();
    render(<EncuadreAlRedimensionar puntos={[[-14.07, -75.73]]} padding={28} maxZoom={15} />);
    mapa.contenedor.clientWidth = 780;
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(200);
    expect(mapa.llamadas.setView).toBe(1);
    expect(mapa.llamadas.fitBounds).toBe(0);
  });
});
