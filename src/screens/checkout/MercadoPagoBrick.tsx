import { useEffect, useRef, useState } from 'react';

interface Props {
  /** Llave pública de Mercado Pago */
  publicKey: string;
  /** Monto del depósito en la moneda configurada (PEN) */
  amount: number;
  /** Callback cuando el brick genera el token.
   *  Devuelve una promesa; si se rechaza el brick permite reintentar. */
  onToken: (metodo: 'TARJETA', data: { token: string; medioPagoId?: string }) => Promise<void>;
  /** Mensaje opcional mientras carga el SDK */
  loadingMessage?: string;
  /** Mensaje de error si el SDK no carga */
  errorMessage?: string;
}

// Tipado mínimo del SDK de Mercado Pago v2 expuesto en window.MercadoPago
interface MercadoPagoSDK {
  new (publicKey: string, options?: { locale?: string }): {
    bricks(): {
      create(
        type: string,
        containerId: string,
        options: {
          initialization: { amount: number };
          customization?: { visual?: { style?: Record<string, string> } };
          callbacks: {
            onReady?: () => void;
            onSubmit: (data: { selectedPaymentMethod: string; formData: { token: string; paymentMethodId?: string } }) => Promise<void>;
            onError?: (err: unknown) => void;
          };
        }
      ): Promise<void>;
      unmount(containerId: string): Promise<void>;
    };
  };
}

declare global {
  interface Window {
    MercadoPago?: MercadoPagoSDK;
  }
}

export function MercadoPagoBrick({
  publicKey,
  amount,
  onToken,
  loadingMessage = 'Cargando pasarela de pagos…',
  errorMessage = 'No se pudo cargar el SDK de Mercado Pago. Verifica tu conexión e inténtalo de nuevo.',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  // Carga dinámica del script de Mercado Pago v2
  useEffect(() => {
    let mounted = true;
    const scriptId = 'mercadopago-sdk-v2';

    const loadScript = () => {
      if (document.getElementById(scriptId)) {
        const check = setInterval(() => {
          if (window.MercadoPago) {
            clearInterval(check);
            if (mounted) setSdkLoaded(true);
          }
        }, 50);
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        if (mounted) setSdkLoaded(true);
      };
      script.onerror = () => {
        if (mounted) setSdkError(true);
      };
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      mounted = false;
    };
  }, []);

  // Inicializa / destruye el Brick cuando el SDK está listo
  useEffect(() => {
    if (!sdkLoaded || !containerRef.current) return;

    const mp = new window.MercadoPago!(publicKey, { locale: 'es-PE' });
    const bricksBuilder = mp.bricks();

    const mountBrick = async () => {
      try {
        await bricksBuilder.create('cardPayment', 'mercadopago-brick-container', {
          initialization: {
            amount,
          },
          customization: {
            visual: {
              style: {
                background: '#ffffff',
                borderRadius: '12px',
              },
            },
          },
          callbacks: {
            onReady: () => {
              // Brick listo
            },
            onSubmit: async ({ formData }) => {
              const token = formData.token;
              const medioPagoId = formData.paymentMethodId;
              await onToken('TARJETA', { token, medioPagoId });
            },
            onError: (err: unknown) => {
              console.error('[MercadoPagoBrick] error', err);
            },
          },
        });
      } catch (e) {
        console.error('[MercadoPagoBrick] create error', e);
      }
    };

    mountBrick();

    // Limpieza al desmontar
    return () => {
      bricksBuilder.unmount('mercadopago-brick-container').catch(() => {});
    };
  }, [sdkLoaded, publicKey, amount, onToken]);

  // Reintentar carga del script
  const retryLoad = () => {
    setSdkError(false);
    const existing = document.getElementById('mercadopago-sdk-v2');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'mercadopago-sdk-v2';
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => setSdkError(true);
    document.head.appendChild(script);
  };

  if (sdkError) {
    return (
      <div className="bg-white rounded-2xl border border-error-200 p-6 text-center">
        <p className="text-sm text-error-700 mb-3">{errorMessage}</p>
        <button
          type="button"
          onClick={retryLoad}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!sdkLoaded) {
    return (
      <div className="bg-white rounded-2xl border border-slatey-200 p-6 text-center">
        <div className="inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm text-slatey-600">{loadingMessage}</p>
      </div>
    );
  }

  return <div ref={containerRef} id="mercadopago-brick-container" />;
}