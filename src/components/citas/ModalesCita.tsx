import { useState } from 'react';
import { Loader2, AlertCircle, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Modal, Badge } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import { obtenerDisponibilidad } from '@/api/catalog';
import {
  reprogramarCita, responderAsistencia, reembolsosDeCita, type CitaApi, type EstadoReembolso,
} from '@/api/citas';
import { diaLima, horaLima, proximosDias, soles } from '@/lib/format';
import { HORA } from './reglas';

const mensaje = (e: unknown, defecto: string) => (e instanceof ApiError ? e.message : defecto);

/* ───────── Reprogramar ───────── */

export function ReprogramarModal({ cita, onClose, onHecho }: { cita: CitaApi | null; onClose: () => void; onHecho: () => void }) {
  const dias = proximosDias(14).slice(1);
  const [fecha, setFecha] = useState(dias[0].fecha);
  const [turno, setTurno] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disponibilidad = useAsync(
    (signal) => (cita ? obtenerDisponibilidad(cita.odontologo.id, cita.servicio.id, fecha, signal) : Promise.resolve(null)),
    [cita?.id, fecha],
  );
  const turnos = (disponibilidad.data?.turnos ?? []).filter((t) => new Date(t.inicio).getTime() - Date.now() >= 24 * HORA);

  const confirmar = async () => {
    if (!cita || !turno) return;
    setGuardando(true);
    setError(null);
    try {
      await reprogramarCita(cita.id, turno);
      setTurno(null);
      onHecho();
    } catch (e) {
      setError(mensaje(e, 'No se pudo reprogramar la cita.'));
      if (e instanceof ApiError && e.status === 409) disponibilidad.reload();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={!!cita} onClose={() => !guardando && onClose()} title="Reprogramar cita">
      {cita && (
        <div className="space-y-4">
          <p className="text-sm text-slatey-600">
            {cita.servicio.titulo} · actualmente es el {diaLima(cita.inicio)} a las {horaLima(cita.inicio)}. Solo puedes reprogramar una vez y
            se mantiene tu depósito.
          </p>
          <div role="group" aria-label="Día" className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {dias.map((d) => (
              <button key={d.fecha} type="button" aria-pressed={fecha === d.fecha} onClick={() => { setFecha(d.fecha); setTurno(null); }}
                className={`min-h-[44px] flex-shrink-0 rounded-xl border-2 px-3 text-xs font-semibold ${fecha === d.fecha ? 'border-primary-400 bg-primary-500 text-white' : 'border-slatey-200 bg-white text-slatey-600'}`}>
                {d.etiqueta}
              </button>
            ))}
          </div>
          {disponibilidad.loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-slatey-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Buscando horarios…</div>
          ) : disponibilidad.error ? (
            <p role="alert" className="text-sm text-error-600">{disponibilidad.error}</p>
          ) : turnos.length === 0 ? (
            <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-700">No hay horarios libres este día.</p>
          ) : (
            <div role="group" aria-label="Hora" className="grid grid-cols-4 gap-2">
              {turnos.map((t) => (
                <button key={t.inicio} type="button" aria-pressed={turno === t.inicio} onClick={() => setTurno(t.inicio)}
                  className={`min-h-[44px] rounded-xl border-2 text-sm font-semibold ${turno === t.inicio ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slatey-200 bg-white text-slatey-600'}`}>
                  {horaLima(t.inicio)}
                </button>
              ))}
            </div>
          )}
          {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClose} disabled={guardando}>Volver</Button>
            <Button loading={guardando} disabled={!turno} onClick={confirmar}>Confirmar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ───────── ¿Te atendieron? ───────── */

function ubicacionActual(): Promise<{ latitud: number; longitud: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Tu equipo no permite obtener la ubicación.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitud: p.coords.latitude, longitud: p.coords.longitude }),
      () => reject(new Error('Activa la ubicación para reportar que el odontólogo no llegó.')),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  });
}

export function AsistenciaModal({ cita, onClose, onHecho }: { cita: CitaApi | null; onClose: () => void; onHecho: () => void }) {
  const [enviando, setEnviando] = useState<'si' | 'no' | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const durante = !!cita && Date.now() <= new Date(cita.fin).getTime() + 2 * HORA;

  const responder = async (atendido: boolean) => {
    if (!cita) return;
    setEnviando(atendido ? 'si' : 'no');
    setError(null);
    try {
      const ubicacion = !atendido && durante ? await ubicacionActual() : undefined;
      const r = await responderAsistencia(cita.id, atendido, ubicacion);
      setResultado(r.mensaje);
      onHecho();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message || 'No se pudo enviar tu respuesta.');
    } finally {
      setEnviando(null);
    }
  };

  const cerrar = () => {
    if (enviando) return;
    setResultado(null);
    setError(null);
    onClose();
  };

  return (
    <Modal open={!!cita} onClose={cerrar} title="¿Te atendieron?">
      {cita && (
        <div className="space-y-4">
          {resultado ? (
            <>
              <p role="status" className="rounded-xl bg-success-50 p-3 text-sm text-success-700">{resultado}</p>
              <Button fullWidth onClick={cerrar}>Listo</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-slatey-600">{cita.servicio.titulo} con {cita.odontologo.nombre}, {diaLima(cita.inicio)} a las {horaLima(cita.inicio)}.</p>
              {durante && (
                <p className="flex gap-2 rounded-xl bg-slatey-50 p-3 text-xs text-slatey-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-primary-600" aria-hidden="true" />
                  Si el odontólogo no llegó, te pediremos tu ubicación: debes estar a menos de 200 m del consultorio.
                </p>
              )}
              {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}
              <div className="grid grid-cols-1 gap-2">
                <Button variant="success" loading={enviando === 'si'} disabled={!!enviando} onClick={() => responder(true)}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Sí, me atendieron
                </Button>
                <Button variant="outline" loading={enviando === 'no'} disabled={!!enviando} onClick={() => responder(false)}>
                  <XCircle className="h-4 w-4" aria-hidden="true" /> No, el odontólogo no llegó
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ───────── Reembolsos ───────── */

const ESTADO_REEMBOLSO: Record<EstadoReembolso, { texto: string; variante: 'success' | 'warning' | 'error' | 'accent' }> = {
  SOLICITADO: { texto: 'Solicitado', variante: 'warning' },
  PROCESANDO: { texto: 'En proceso', variante: 'accent' },
  REEMBOLSADO: { texto: 'Reembolsado', variante: 'success' },
  RECHAZADO: { texto: 'Rechazado', variante: 'error' },
  ERROR: { texto: 'Con error', variante: 'error' },
};

export function ReembolsosModal({ cita, onClose }: { cita: CitaApi | null; onClose: () => void }) {
  const lista = useAsync((): Promise<Awaited<ReturnType<typeof reembolsosDeCita>> | null> => (cita ? reembolsosDeCita(cita.id) : Promise.resolve(null)), [cita?.id]);
  return (
    <Modal open={!!cita} onClose={onClose} title="Reembolsos">
      {lista.loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-label="Cargando reembolsos" /></div>
      ) : lista.error ? (
        <p role="alert" className="flex items-center gap-2 text-sm text-error-600"><AlertCircle className="h-4 w-4" aria-hidden="true" /> {lista.error}</p>
      ) : (lista.data ?? []).length === 0 ? (
        <p className="text-sm text-slatey-600">Esta cita no tiene reembolsos.</p>
      ) : (
        <ul className="space-y-3">
          {(lista.data ?? []).map((r) => (
            <li key={r.id} className="space-y-1 rounded-2xl border border-slatey-100 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slatey-900">{soles(r.monto)}</span>
                <Badge variant={ESTADO_REEMBOLSO[r.estado].variante} size="sm">{ESTADO_REEMBOLSO[r.estado].texto}</Badge>
              </div>
              {r.motivo && <p className="text-xs text-slatey-600">{r.motivo}</p>}
              <p className="text-[11px] text-slatey-500">
                Solicitado el {diaLima(r.solicitadoEn)}{r.procesadoEn ? ` · procesado el ${diaLima(r.procesadoEn)}` : ''}{r.simulado ? ' · pago de prueba' : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
