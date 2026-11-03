import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ArrowRight, Star, Loader2, CheckCheck } from 'lucide-react';
import { useApp } from '@/storeHooks';
import { Button } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import { citasPorResenar, crearResena } from '@/api/panel';
import { marcarNotificacionLeida, marcarTodasNotificacionesLeidas, misNotificaciones, type NotificacionUsuario } from '@/api/usuarios';

/**
 * El backend envía avisos por correo, pero no expone una bandeja de notificaciones.
 * Esta pantalla muestra lo que requiere atención según el estado REAL de tus citas
 * (GET /api/citas/mias y GET /api/citas/por-resenar). Nada se inventa ni se guarda localmente.
 */
function Resena({ citaId, odontologo, servicio, onListo }: { citaId: string; odontologo: string; servicio: string; onListo: () => void }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviar = async () => {
    if (!nota || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await crearResena(citaId, nota, comentario.trim() || undefined);
      onListo();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo enviar tu reseña.');
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-4 space-y-3 shadow-sm shadow-primary-500/5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Star className="h-5 w-5" /></div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slatey-900">¿Cómo te fue?</h3>
          <p className="text-xs text-slatey-600 mt-0.5">{servicio} con {odontologo}</p>
        </div>
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={nota === n} aria-label={`${n} estrellas`} onClick={() => setNota(n)} className="p-1">
            <Star className={`h-7 w-7 ${n <= nota ? 'fill-amber-400 text-amber-400' : 'text-slatey-300'}`} />
          </button>
        ))}
      </div>
      <textarea value={comentario} onChange={(e) => setComentario(e.target.value.slice(0, 1000))} rows={2} placeholder="Comentario (opcional)" aria-label="Comentario" className="w-full px-3 py-2.5 rounded-xl border-2 border-slatey-200 bg-slatey-50 text-sm focus:border-primary-400 focus:outline-none resize-none" />
      {error && <p role="alert" className="text-xs font-medium text-error-600">{error}</p>}
      <Button fullWidth size="sm" disabled={!nota} loading={enviando} onClick={enviar}>Enviar reseña</Button>
    </div>
  );
}

export default function PatientNotifications() {
  const { setScreen, user } = useApp();
  const porResenar = useAsync((signal) => citasPorResenar(signal), []);
  const bandeja = useAsync((signal) => misNotificaciones(signal), []);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const pendientesResena = porResenar.data ?? [];
  const avisos = bandeja.data?.notificaciones ?? [];
  const vacio = avisos.length === 0 && pendientesResena.length === 0;

  const abrirAviso = (aviso: NotificacionUsuario) => {
    if (aviso.citaId) setScreen('misCitas');
  };

  const marcarLeida = async (id: string) => {
    if (procesando) return;
    setProcesando(id);
    setErrorAccion(null);
    try {
      await marcarNotificacionLeida(id);
      await bandeja.reload();
    } catch (e) {
      setErrorAccion(e instanceof ApiError ? e.message : 'No se pudo marcar la notificación.');
    } finally {
      setProcesando(null);
    }
  };

  const marcarTodas = async () => {
    if (procesando || !bandeja.data?.noLeidas) return;
    setProcesando('all');
    setErrorAccion(null);
    try {
      await marcarTodasNotificacionesLeidas();
      await bandeja.reload();
    } catch (e) {
      setErrorAccion(e instanceof ApiError ? e.message : 'No se pudieron marcar las notificaciones.');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto overscroll-y-contain bg-slatey-50 pb-28">
      <div className="sticky top-0 z-30 border-b border-slatey-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slatey-900 font-display">Notificaciones</h2>
            <p className="text-xs text-slatey-500">{user.fullName || 'Paciente'} · Lo que necesita tu atención</p>
          </div>
          <div className="flex items-center gap-2">
            {Boolean(bandeja.data?.noLeidas) && (
              <button onClick={marcarTodas} disabled={procesando !== null} className="rounded-xl px-2 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50">
                <CheckCheck className="mr-1 inline h-4 w-4" /> Leer todas
              </button>
            )}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50"><Bell className="h-5 w-5 text-primary-600" /></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-4 px-4 py-5">
        {bandeja.loading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary-500" aria-label="Cargando notificaciones" /></div>}
        {bandeja.error && <div role="alert" className="rounded-2xl border border-error-100 bg-error-50 p-4 text-sm text-error-700">{bandeja.error}<Button size="sm" variant="outline" className="mt-3" onClick={bandeja.reload}>Reintentar</Button></div>}
        {errorAccion && <p role="alert" className="text-xs font-medium text-error-600">{errorAccion}</p>}
        {porResenar.loading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary-500" aria-label="Cargando" /></div>}
        {pendientesResena.map((p) => (
          <Resena key={p.citaId} citaId={p.citaId} odontologo={p.odontologo} servicio={p.servicio} onListo={porResenar.reload} />
        ))}

        {avisos.map((a) => {
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border bg-white p-4 ${a.leida ? 'border-slatey-100' : 'border-primary-200 shadow-sm'}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50"><Bell className="h-5 w-5 text-primary-600" /></div>
                <div className="min-w-0 flex-1">
                  <button className="text-left" onClick={() => abrirAviso(a)}>
                    <h3 className="text-sm font-bold text-slatey-900">{a.titulo}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slatey-600">{a.mensaje}</p>
                  </button>
                  {!a.leida && (
                    <button
                      onClick={() => void marcarLeida(a.id)}
                      disabled={procesando !== null}
                      className="mt-3 flex items-center gap-1.5 rounded-xl bg-slatey-50 px-3 py-2 text-xs font-bold text-primary-600 hover:bg-primary-50"
                    >
                      Marcar como leída <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {vacio && !porResenar.loading && !bandeja.loading && !bandeja.error && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slatey-200 bg-white py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-50"><Bell className="h-7 w-7 text-success-500" /></div>
            <h3 className="text-sm font-bold text-slatey-900">Todo está al día</h3>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slatey-500">Cuando una cita necesite tu atención (pago, confirmación o reseña) la verás aquí. Los recordatorios te llegan también por correo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
