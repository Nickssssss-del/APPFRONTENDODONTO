import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ErrorCode, GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

/**
 * En el navegador: botón oficial de Google Identity Services.
 * En Android: Google Sign-In nativo (Credential Manager). No se carga GIS en el WebView.
 * El ID token se envía a POST /api/auth/google; el backend lo verifica.
 * VITE_GOOGLE_CLIENT_ID es el Client ID web. En Android el plugin lo usa como server client id.
 */
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();
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
      scriptPromise = null;
      reject(new Error('No se pudo cargar Google'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

function codigoDe(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

/** Errores del selector nativo, antes de llamar al backend. null = el usuario canceló y no hay que mostrar nada. */
function mensajeNativo(error: unknown): string | null {
  const code = codigoDe(error);
  const mensaje = mensajeDe(error);
  if (code === ErrorCode.SignInCanceled) {
    if (/reauth|unregistered|api console|configuration/i.test(mensaje)) {
      return 'Google no reconoce esta instalación. Falta el cliente OAuth Android con el package y el SHA-1 de esta firma.';
    }
    return null;
  }
  if (code === ErrorCode.NoCredentialAvailable) {
    return 'No hay una cuenta de Google en este dispositivo.';
  }
  if (code === ErrorCode.ProviderConfigurationError) {
    return 'Google Play Services no está disponible o está desactualizado.';
  }
  if (/network|offline|internet|connection|conexión|timed out|timeout/i.test(mensaje)) {
    return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  return 'No se pudo abrir Google. Inténtalo de nuevo.';
}

type Props = { onCredential: (idToken: string) => void; disabled?: boolean };

function BotonAndroid({ onCredential, disabled }: Props) {
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const pulsar = async () => {
    if (disabled || ocupado) return;
    setAviso(null);
    if (!CLIENT_ID) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setAviso('Sin conexión. Revisa tu internet e inténtalo de nuevo.');
      return;
    }
    setOcupado(true);
    try {
      await GoogleSignIn.initialize({ clientId: CLIENT_ID });
      const resultado = await GoogleSignIn.signIn();
      if (!resultado.idToken) {
        setAviso('Google no entregó un ID token. Vuelve a intentarlo.');
        return;
      }
      cb.current(resultado.idToken);
    } catch (error) {
      setAviso(mensajeNativo(error));
    } finally {
      setOcupado(false);
    }
  };

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Falta VITE_GOOGLE_CLIENT_ID"
        className="w-full py-3 px-4 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-500 font-bold text-xs cursor-not-allowed"
      >
        Google no disponible
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void pulsar()}
        disabled={disabled || ocupado}
        className="disabled:opacity-60 w-full py-3 px-4 rounded-2xl bg-white border border-slatey-200 text-slatey-800 font-bold text-sm"
      >
        {ocupado ? 'Abriendo Google…' : 'Continuar con Google'}
      </button>
      {aviso && (
        <p role="alert" className="text-xs font-medium text-error-700">
          {aviso}
        </p>
      )}
    </div>
  );
}

export default function GoogleButton({ onCredential, disabled }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const android = Capacitor.getPlatform() === 'android';
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>(CLIENT_ID ? 'cargando' : 'error');

  useEffect(() => {
    if (android || !CLIENT_ID) return;
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
  }, [android]);

  if (android) {
    return <BotonAndroid onCredential={onCredential} disabled={disabled} />;
  }

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
