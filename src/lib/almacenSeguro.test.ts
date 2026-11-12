import { beforeEach, describe, expect, it, vi } from 'vitest';

// Simulación de Android: el almacén cifrado es un Map en memoria.
const seguro = vi.hoisted(() => new Map<string, string>());
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    get: vi.fn(async (k: string) => seguro.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => { seguro.set(k, v); }),
    remove: vi.fn(async (k: string) => seguro.delete(k)),
  },
}));

import { borrarRefresh, guardarRefresh, leerRefreshGuardado } from './almacenSeguro';

const CLAVE = 'odonto_refresh_token';
beforeEach(() => {
  seguro.clear();
  localStorage.clear();
});

describe('almacén seguro del refresh token (Android simulado)', () => {
  it('migra el token antiguo de localStorage al almacén cifrado y lo borra de localStorage', async () => {
    localStorage.setItem(CLAVE, 'token-viejo');
    expect(await leerRefreshGuardado()).toBe('token-viejo');
    expect(localStorage.getItem(CLAVE)).toBeNull();
    expect(seguro.get(CLAVE)).toBe('token-viejo');
  });

  it('guarda y borra solo en el almacén cifrado', async () => {
    await guardarRefresh('token-nuevo');
    expect(localStorage.getItem(CLAVE)).toBeNull();
    expect(await leerRefreshGuardado()).toBe('token-nuevo');
    await borrarRefresh();
    expect(await leerRefreshGuardado()).toBeNull();
  });
});
