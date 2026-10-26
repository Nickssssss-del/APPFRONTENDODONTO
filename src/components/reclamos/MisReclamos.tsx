import { useState } from 'react';
import { MessageSquareWarning, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button, Input, Modal, Badge } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import type { CitaApi } from '@/api/citas';
import {
  misReclamos, crearReclamo, cerrarReclamo, ETIQUETA_TIPO_RECLAMO, ETIQUETA_ESTADO_RECLAMO,
  type Reclamo, type TipoReclamo, type EstadoReclamo,
} from '@/api/reclamos';
import { diaLima, horaLima } from '@/lib/format';

const VARIANTE: Record<EstadoReclamo, 'warning' | 'accent' | 'success' | 'neutral'> = {
  ABIERTO: 'warning',
  EN_PROCESO: 'accent',
  RESUELTO: 'success',
  CERRADO: 'neutral',
};

/** Libro de reclamaciones del usuario: lista, registra (opcionalmente sobre una cita) y cierra. */
export function MisReclamos({ citas, citaInicial }: { citas: CitaApi[]; citaInicial?: string | null }) {
  const lista = useAsync(() => misReclamos(), []);
  const [nuevo, setNuevo] = useState(!!citaInicial);
  const [cerrando, setCerrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cerrar = async (r: Reclamo) => {
    setCerrando(r.id);
    setError(null);
    try {
      await cerrarReclamo(r.id);
      lista.reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cerrar el reclamo.');
    } finally {
      setCerrando(null);
    }
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slatey-900">
          <MessageSquareWarning className="h-4 w-4 text-primary-600" aria-hidden="true" /> Libro de reclamaciones
        </h3>
        <Button size="sm" onClick={() => setNuevo(true)}><Plus className="h-4 w-4" aria-hidden="true" /> Nuevo</Button>
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}

      {lista.loading ? (
        <div className="flex justify-center py-8" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-label="Cargando reclamos" />
        </div>
      ) : lista.error ? (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-2xl border border-slatey-100 bg-white p-6 text-center">
          <AlertCircle className="h-6 w-6 text-accent-600" aria-hidden="true" />
          <p className="text-sm text-slatey-600">{lista.error}</p>
          <Button size="sm" onClick={lista.reload}>Reintentar</Button>
        </div>
      ) : (lista.data ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slatey-200 bg-white p-6 text-center text-xs text-slatey-500">
          No has registrado consultas ni reclamos.
        </p>
      ) : (
        <ul className="space-y-3">
          {(lista.data ?? []).map((r) => (
            <li key={r.id} className="space-y-2 rounded-2xl border border-slatey-100 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slatey-500">{r.codigo} · {ETIQUETA_TIPO_RECLAMO[r.tipo]}</p>
                  <p className="truncate text-sm font-bold text-slatey-900">{r.asunto}</p>
                </div>
                <Badge variant={VARIANTE[r.estado]} size="sm">{ETIQUETA_ESTADO_RECLAMO[r.estado]}</Badge>
              </div>
              {r.servicio && <p className="text-xs text-slatey-500">{r.servicio}{r.odontologo ? ` · ${r.odontologo}` : ''}</p>}
              <p className="whitespace-pre-line text-xs text-slatey-700">{r.descripcion}</p>
              {r.respuesta && (
                <div className="rounded-xl bg-primary-50 p-3 text-xs text-slatey-700">
                  <p className="mb-1 font-bold text-primary-700">Respuesta</p>
                  <p className="whitespace-pre-line">{r.respuesta}</p>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 text-[11px] text-slatey-500">
                <span>Registrado el {diaLima(r.creadoEn)}{r.responderAntes ? ` · respuesta hasta el ${r.responderAntes}` : ''}</span>
                {r.estado !== 'CERRADO' && (
                  <Button size="sm" variant="ghost" loading={cerrando === r.id} onClick={() => cerrar(r)}>Cerrar</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <NuevoReclamo
        abierto={nuevo}
        citas={citas}
        citaInicial={citaInicial ?? null}
        onCerrar={() => setNuevo(false)}
        onCreado={() => { setNuevo(false); lista.reload(); }}
      />
    </div>
  );
}

export function NuevoReclamo({ abierto, citas, citaInicial, onCerrar, onCreado }: {
  abierto: boolean; citas: CitaApi[]; citaInicial: string | null; onCerrar: () => void; onCreado: () => void;
}) {
  const [tipo, setTipo] = useState<TipoReclamo>(citaInicial ? 'RECLAMO' : 'CONSULTA');
  const [citaId, setCitaId] = useState<string>(citaInicial ?? '');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!asunto.trim() || !descripcion.trim()) return setError('Completa el asunto y la descripción.');
    setEnviando(true);
    setError(null);
    try {
      await crearReclamo({ tipo, asunto: asunto.trim(), descripcion: descripcion.trim(), citaId: citaId || undefined });
      setAsunto('');
      setDescripcion('');
      onCreado();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar.');
    } finally {
      setEnviando(false);
    }
  };

  const campo = 'w-full rounded-2xl border-2 border-slatey-200 bg-slatey-50 px-4 py-3 text-sm text-slatey-900 focus:border-primary-400 focus:bg-white focus:outline-none';

  return (
    <Modal open={abierto} onClose={() => !enviando && onCerrar()} title="Nuevo registro">
      <div className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-slatey-700">Tipo</legend>
          <div className="grid grid-cols-3 gap-2">
            {(['CONSULTA', 'INCIDENCIA', 'RECLAMO'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={tipo === t} onClick={() => setTipo(t)}
                className={`min-h-[44px] rounded-xl border-2 text-xs font-bold ${tipo === t ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slatey-200 bg-white text-slatey-600'}`}>
                {ETIQUETA_TIPO_RECLAMO[t]}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="reclamo-cita" className="mb-1.5 block text-sm font-semibold text-slatey-700">Cita relacionada (opcional)</label>
          <select id="reclamo-cita" value={citaId} onChange={(e) => setCitaId(e.target.value)} className={campo}>
            <option value="">Sobre la plataforma (soporte)</option>
            {citas.map((c) => (
              <option key={c.id} value={c.id}>{c.servicio.titulo} · {diaLima(c.inicio)} {horaLima(c.inicio)}</option>
            ))}
          </select>
        </div>
        <Input label="Asunto" value={asunto} onChange={(v) => setAsunto(v.slice(0, 150))} maxLength={150} />
        <div>
          <label htmlFor="reclamo-descripcion" className="mb-1.5 block text-sm font-semibold text-slatey-700">Descripción</label>
          <textarea id="reclamo-descripcion" rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value.slice(0, 4000))} className={campo} />
        </div>
        {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onCerrar} disabled={enviando}>Cancelar</Button>
          <Button loading={enviando} onClick={enviar}>Registrar</Button>
        </div>
      </div>
    </Modal>
  );
}
