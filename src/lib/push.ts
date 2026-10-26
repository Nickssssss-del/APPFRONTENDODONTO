import { registrarDispositivo, quitarDispositivo } from '@/api/usuarios';

/**
 * Notificaciones push (Firebase Cloud Messaging) → POST /api/usuarios/yo/dispositivos.
 *
 * Apagado por defecto: en Android, PushNotifications.register() cierra la app si falta
 * android/app/google-services.json. Cuando el proyecto de Firebase esté listo:
 *   1) copiar google-services.json a android/app/
 *   2) VITE_PUSH_ENABLED=true en .env  →  npm run build && npx cap sync android
 */
const HABILITADO = import.meta.env.VITE_PUSH_ENABLED === 'true';
const CLAVE = 'odonto:push-token';

let tokenActual: string | null = null;

export async function activarPush(): Promise<void> {
  if (!HABILITADO) return;
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) return;
  const { PushNotifications } = await import('@capacitor/push-notifications');

  let permiso = await PushNotifications.checkPermissions();
  if (permiso.receive === 'prompt') permiso = await PushNotifications.requestPermissions();
  if (permiso.receive !== 'granted') return;

  await PushNotifications.removeAllListeners();
  await PushNotifications.addListener('registration', async ({ value }: { value: string }) => {
    tokenActual = value;
    try {
      localStorage.setItem(CLAVE, value);
    } catch {
      /* sin almacenamiento: se usa el token en memoria */
    }
    // Se llama en cada inicio de sesión y cada vez que Firebase renueva el token
    await registrarDispositivo(value, Capacitor.getPlatform() === 'ios' ? 'IOS' : 'ANDROID').catch((e) =>
      console.error('No se pudo registrar el dispositivo para push', e),
    );
  });
  await PushNotifications.register();
}

/** Llamar ANTES de cerrar sesión (mientras el access token sigue vigente). */
export async function desactivarPush(): Promise<void> {
  if (!HABILITADO) return;
  let token = tokenActual;
  try {
    token = token ?? localStorage.getItem(CLAVE);
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento */
  }
  tokenActual = null;
  if (token) await quitarDispositivo(token).catch(() => undefined);
}
