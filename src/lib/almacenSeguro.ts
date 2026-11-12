import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

/**
 * Almacén del refresh token.
 *  - Android: cifrado con AES-GCM y una clave del Android Keystore (no queda en localStorage de la WebView).
 *  - Web (desarrollo en navegador): localStorage, como antes.
 * Migra una sola vez el token que versiones anteriores guardaban en localStorage.
 */
const CLAVE = 'odonto_refresh_token';
const esNativo = () => Capacitor.isNativePlatform();

function leerLocal(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}
function borrarLocal() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* noop */
  }
}

export async function leerRefreshGuardado(): Promise<string | null> {
  if (!esNativo()) return leerLocal();
  const anterior = leerLocal();
  if (anterior) {
    // Migración: pasa al almacén cifrado y desaparece de localStorage.
    await SecureStorage.set(CLAVE, anterior);
    borrarLocal();
    return anterior;
  }
  const valor = await SecureStorage.get(CLAVE);
  return typeof valor === 'string' && valor ? valor : null;
}

export async function guardarRefresh(valor: string): Promise<void> {
  if (!esNativo()) {
    try {
      localStorage.setItem(CLAVE, valor);
    } catch {
      /* modo privado: la sesión durará hasta recargar */
    }
    return;
  }
  await SecureStorage.set(CLAVE, valor);
}

export async function borrarRefresh(): Promise<void> {
  borrarLocal();
  if (esNativo()) await SecureStorage.remove(CLAVE);
}
