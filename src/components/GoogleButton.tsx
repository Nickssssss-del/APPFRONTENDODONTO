import { useEffect, useRef, useState } from 'react';

/**
 * Botón oficial "Continuar con Google" (Google Identity Services).
 * Entrega un ID token (JWT) que se envía a POST /api/auth/google; el backend lo verifica.
 * Requiere VITE_GOOGLE_CLIENT_ID (el mismo valor que GOOGLE_CLIENT_ID del backend).
 */
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '') as string;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

type GsiCredential = { credential?: string };
type GsiApi = {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: GsiCredential) => void; ux_mode?: string }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
};

let scriptPromise: Promise<GsiApi> | null = null;

function cargarGoogle(): Promise<GsiApi> {
  const w = window as unknown as { google?: GsiApi };
  if (w.google?.accounts?.id) return Promise.resolve(w.google);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<GsiApi>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => (w.google?.accounts?.id ? resolve(w.google) : reject(new Error('Google no cargó')));
    s.onerror = () => {
      scriptPromise = null; // permite reintentar
      reject(new Error('No se pudo cargar Google'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

type Props = { onCredential: (idToken: string) => void; disabled?: boolean };

export default function GoogleButton({ onCredential, disabled }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>(CLIENT_ID ? 'cargando' : 'error');

  useEffect(() => {
    if (!CLIENT_ID) return;
    let vivo = true;
    cargarGoogle()
      .then((g) => {
        if (!vivo || !host.current) return;
        g.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: 'popup',
          callback: (r) => r.credential && cb.current(r.credential),
        });
        g.accounts.id.renderButton(host.current, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
          text: 'continue_with', logo_alignment: 'center', locale: 'es',
          width: Math.min(400, Math.max(200, host.current.offsetWidth)),
        });
        setEstado('listo');
      })
      .catch(() => vivo && setEstado('error'));
    return () => {
      vivo = false;
    };
  }, []);

  if (estado === 'error') {
    return (
      <button
        type="button"
        disabled
        title={CLIENT_ID ? 'No se pudo cargar Google. Revisa tu conexión.' : 'Falta VITE_GOOGLE_CLIENT_ID'}
        className="w-full py-3 px-4 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-500 font-bold text-xs cursor-not-allowed"
      >
        Google no disponible
      </button>
    );
  }

  return (
    <div className={`relative flex justify-center min-h-[44px] ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div ref={host} className="w-full flex justify-center" />
      {estado === 'cargando' && (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-slatey-500">Cargando Google…</span>
      )}
    </div>
  );
}
