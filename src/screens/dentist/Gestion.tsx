import { useState, type ReactNode } from 'react';
import {
  FileSpreadsheet, Gavel, UserX, MessageSquareWarning, Loader2, AlertCircle, ExternalLink,
} from 'lucide-react';
import { Badge, Button, Modal } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import {
  apelacionesRecibidas, resolverApelacion, reportesAusencia, responderReporteAusencia, descargarLiquidacionesExcel,
  guardarArchivo, type Apelacion, type ReporteAusencia,
} from '@/api/panel';
import {
  reclamosRecibidos, responderReclamo, ETIQUETA_ESTADO_RECLAMO, ETIQUETA_TIPO_RECLAMO, type Reclamo,
} from '@/api/reclamos';
import { diaLima, horaLima, fechaIsoLima } from '@/lib/format';

const mensaje = (e: unknown, defecto: string) => (e instanceof ApiError ? e.message : defecto);
const campo = 'w-full rounded-2xl border-2 border-slatey-200 bg-slatey-50 px-4 py-3 text-sm text-slatey-900 focus:border-primary-400 focus:bg-white focus:outline-none';

/** Pestaña "Gestión" del odontólogo: liquidaciones en Excel, apelaciones, reportes de ausencia y reclamos. */
export default function Gestion() {
  return (
    <div className="space-y-5">
      <ExportarExcel />
      <Apelaciones />
      <ReportesAusencia />
      <Reclamos />
    </div>
  );
}

function Seccion({ id, titulo, icono, children, extra }: { id: string; titulo: string; icono: ReactNode; children: ReactNode; extra?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3 rounded-2xl border border-slatey-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id={id} className="flex items-center gap-2 text-sm font-bold text-slatey-900">{icono}{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Estado({ loading, error, vacio, onRetry, children }: { loading: boolean; error: string | null; vacio: boolean; onRetry: () => void; children: ReactNode }) {
  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary-500" aria-label="Cargando" /></div>;
  if (error) {
    return (
      <div role="alert" className="flex items-center justify-between gap-2 text-xs text-error-600">
        <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}</span>
        <Button size="sm" variant="ghost" onClick={onRetry}>Reintentar</Button>
      </div>
    );
  }
  if (vacio) return <p className="text-xs text-slatey-500">No hay nada pendiente.</p>;
  return <>{children}</>;
}

/* ───────── Excel ───────── */

function ExportarExcel() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descargar = async () => {
    setCargando(true);
    setError(null);
    try {
      await guardarArchivo(await descargarLiquidacionesExcel(), `liquidaciones-${fechaIsoLima(new Date())}.xlsx`);
    } catch (e) {
      setError(mensaje(e, 'No se pudo descargar el Excel.'));
    } finally {
      setCargando(false);
    }
  };
  return (
    <Seccion id="g-excel" titulo="Mis liquidaciones" icono={<FileSpreadsheet className="h-4 w-4 text-primary-600" aria-hidden="true" />}>
      <p className="text-xs text-slatey-600">Descarga en Excel los depósitos en custodia, pagados y devueltos.</p>
      {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}
      <Button size="sm" fullWidth variant="outline" loading={cargando} onClick={descargar}>
        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Descargar Excel
      </Button>
    </Seccion>
  );
}

/* ───────── Apelaciones ───────── */

function Apelaciones() {
  const lista = useAsync((s) => apelacionesRecibidas(s), []);
  const [actual, setActual] = useState<Apelacion | null>(null);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState<'si' | 'no' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendientes = (lista.data ?? []).filter((a) => a.estado === 'PENDIENTE');

  const resolver = async (aprobar: boolean) => {
    if (!actual) return;
    setEnviando(aprobar ? 'si' : 'no');
    setError(null);
    try {
      await resolverApelacion(actual.id, aprobar, nota.trim());
      setActual(null);
      setNota('');
      lista.reload();
    } catch (e) {
      setError(mensaje(e, 'No se pudo resolver la apelación.'));
    } finally {
      setEnviando(null);
    }
  };

  return (
    <Seccion id="g-apelaciones" titulo="Apelaciones de inasistencia" icono={<Gavel className="h-4 w-4 text-primary-600" aria-hidden="true" />}
      extra={pendientes.length > 0 ? <Badge variant="warning" size="sm">{pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}</Badge> : undefined}>
      <Estado loading={lista.loading} error={lista.error} vacio={(lista.data ?? []).length === 0} onRetry={lista.reload}>
        <ul className="space-y-2">
          {(lista.data ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-slatey-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slatey-900">{a.paciente}</p>
                <p className="text-[11px] text-slatey-500">{a.servicio} · {diaLima(a.fechaCita)} {horaLima(a.fechaCita)}</p>
              </div>
              {a.estado === 'PENDIENTE' ? (
                <Button size="sm" onClick={() => setActual(a)}>Revisar</Button>
              ) : (
                <Badge variant={a.estado === 'APROBADA' ? 'success' : 'error'} size="sm">{a.estado === 'APROBADA' ? 'Aprobada' : 'Rechazada'}</Badge>
              )}
            </li>
          ))}
        </ul>
      </Estado>

      <Modal open={!!actual} onClose={() => !enviando && setActual(null)} title="Revisar apelación">
        {actual && (
          <div className="space-y-4">
            <p className="text-sm text-slatey-600">
              {actual.paciente} pide que se quite la inasistencia de su cita del {diaLima(actual.fechaCita)}.
              {actual.strikesDelPaciente != null && ` Tiene ${actual.strikesDelPaciente} falta(s).`}
            </p>
            {actual.certificadoUrl ? (
              <a href={actual.certificadoUrl} target="_blank" rel="noreferrer"
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-primary-200 text-sm font-semibold text-primary-700">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver certificado (enlace de 10 min)
              </a>
            ) : (
              <p className="text-xs text-slatey-500">El certificado no está disponible ahora. Vuelve a abrir la apelación.</p>
            )}
            <div>
              <label htmlFor="apelacion-nota" className="mb-1.5 block text-sm font-semibold text-slatey-700">Nota (opcional)</label>
              <textarea id="apelacion-nota" rows={3} value={nota} onChange={(e) => setNota(e.target.value.slice(0, 500))} className={campo} />
            </div>
            {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" loading={enviando === 'no'} disabled={!!enviando} onClick={() => resolver(false)}>Rechazar</Button>
              <Button variant="success" loading={enviando === 'si'} disabled={!!enviando} onClick={() => resolver(true)}>Aprobar</Button>
            </div>
          </div>
        )}
      </Modal>
    </Seccion>
  );
}

/* ───────── Reportes de ausencia ───────── */

const ESTADO_REPORTE: Record<ReporteAusencia['estado'], { texto: string; variante: 'warning' | 'error' | 'success' | 'accent' }> = {
  PENDIENTE: { texto: 'Por responder', variante: 'warning' },
  CONFIRMADO: { texto: 'Falta confirmada', variante: 'error' },
  RECHAZADO: { texto: 'Rechazado', variante: 'success' },
  EN_RECLAMO: { texto: 'En reclamo', variante: 'accent' },
};

function ReportesAusencia() {
  const lista = useAsync((s) => reportesAusencia(s), []);
  const [actual, setActual] = useState<ReporteAusencia | null>(null);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState<'si' | 'no' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const responder = async (atendi: boolean) => {
    if (!actual) return;
    setEnviando(atendi ? 'si' : 'no');
    setError(null);
    try {
      await responderReporteAusencia(actual.id, atendi, nota.trim());
      setActual(null);
      setNota('');
      lista.reload();
    } catch (e) {
      setError(mensaje(e, 'No se pudo responder el reporte.'));
    } finally {
      setEnviando(null);
    }
  };

  return (
    <Seccion id="g-reportes" titulo="Reportes de ausencia" icono={<UserX className="h-4 w-4 text-primary-600" aria-hidden="true" />}>
      <p className="text-xs text-slatey-600">Pacientes que indicaron que no los atendiste. Tienes 48 h para responder.</p>
      <Estado loading={lista.loading} error={lista.error} vacio={(lista.data ?? []).length === 0} onRetry={lista.reload}>
        <ul className="space-y-2">
          {(lista.data ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-slatey-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slatey-900">{r.paciente}</p>
                <p className="text-[11px] text-slatey-500">
                  {r.servicio} · {diaLima(r.fechaCita)} {horaLima(r.fechaCita)}
                  {r.estado === 'PENDIENTE' && ` · responde antes del ${diaLima(r.responderAntes)} ${horaLima(r.responderAntes)}`}
                </p>
              </div>
              {r.estado === 'PENDIENTE' ? (
                <Button size="sm" onClick={() => setActual(r)}>Responder</Button>
              ) : (
                <Badge variant={ESTADO_REPORTE[r.estado].variante} size="sm">{ESTADO_REPORTE[r.estado].texto}</Badge>
              )}
            </li>
          ))}
        </ul>
      </Estado>

      <Modal open={!!actual} onClose={() => !enviando && setActual(null)} title="Responder reporte">
        {actual && (
          <div className="space-y-4">
            <p className="text-sm text-slatey-600">
              {actual.paciente} reportó que no lo atendiste el {diaLima(actual.fechaCita)}.
              {actual.distanciaMetros != null && ` Estaba a ${actual.distanciaMetros} m del consultorio.`}
            </p>
            <p className={`rounded-xl p-3 text-xs ${actual.historiaRegistrada ? 'bg-success-50 text-success-700' : 'bg-accent-50 text-accent-700'}`}>
              {actual.historiaRegistrada
                ? 'Ya registraste la historia clínica de esta cita: sirve como prueba de la atención.'
                : 'Para indicar que sí lo atendiste, primero registra la historia clínica de la cita (es la prueba).'}
            </p>
            <div>
              <label htmlFor="reporte-nota" className="mb-1.5 block text-sm font-semibold text-slatey-700">Nota (opcional)</label>
              <textarea id="reporte-nota" rows={3} value={nota} onChange={(e) => setNota(e.target.value.slice(0, 2000))} className={campo} />
            </div>
            {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}
            <div className="grid grid-cols-1 gap-2">
              <Button variant="success" loading={enviando === 'si'} disabled={!!enviando || !actual.historiaRegistrada} onClick={() => responder(true)}>Sí lo atendí</Button>
              <Button variant="outline" loading={enviando === 'no'} disabled={!!enviando} onClick={() => responder(false)}>Admito la falta (se reembolsa al paciente)</Button>
            </div>
          </div>
        )}
      </Modal>
    </Seccion>
  );
}

/* ───────── Reclamos ───────── */

function Reclamos() {
  const lista = useAsync(() => reclamosRecibidos(), []);
  const [actual, setActual] = useState<Reclamo | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [resuelto, setResuelto] = useState(true);
  const [devolver, setDevolver] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abrir = (r: Reclamo) => {
    setActual(r);
    setRespuesta(r.respuesta ?? '');
    setResuelto(true);
    setDevolver(false);
    setError(null);
  };

  const enviar = async () => {
    if (!actual || !respuesta.trim()) return setError('Escribe la respuesta.');
    setEnviando(true);
    setError(null);
    try {
      await responderReclamo(actual.id, respuesta.trim(), resuelto, devolver || undefined);
      setActual(null);
      lista.reload();
    } catch (e) {
      setError(mensaje(e, 'No se pudo enviar la respuesta.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Seccion id="g-reclamos" titulo="Reclamos de pacientes" icono={<MessageSquareWarning className="h-4 w-4 text-primary-600" aria-hidden="true" />}>
      <Estado loading={lista.loading} error={lista.error} vacio={(lista.data ?? []).length === 0} onRetry={lista.reload}>
        <ul className="space-y-2">
          {(lista.data ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-slatey-50 p-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slatey-500">{r.codigo} · {ETIQUETA_TIPO_RECLAMO[r.tipo]}</p>
                <p className="truncate text-sm font-semibold text-slatey-900">{r.asunto}</p>
                <p className="text-[11px] text-slatey-500">{r.reclamante}{r.responderAntes ? ` · responder hasta ${r.responderAntes}` : ''}</p>
              </div>
              {r.estado === 'ABIERTO' || r.estado === 'EN_PROCESO' ? (
                <Button size="sm" onClick={() => abrir(r)}>Responder</Button>
              ) : (
                <Badge variant={r.estado === 'RESUELTO' ? 'success' : 'neutral'} size="sm">{ETIQUETA_ESTADO_RECLAMO[r.estado]}</Badge>
              )}
            </li>
          ))}
        </ul>
      </Estado>

      <Modal open={!!actual} onClose={() => !enviando && setActual(null)} title={actual ? `Reclamo ${actual.codigo}` : 'Reclamo'}>
        {actual && (
          <div className="space-y-4">
            <div className="space-y-1 rounded-xl bg-slatey-50 p-3">
              <p className="text-sm font-bold text-slatey-900">{actual.asunto}</p>
              {actual.servicio && <p className="text-[11px] text-slatey-500">{actual.servicio}{actual.fechaCita ? ` · ${diaLima(actual.fechaCita)}` : ''}</p>}
              <p className="whitespace-pre-line text-xs text-slatey-700">{actual.descripcion}</p>
            </div>
            <div>
              <label htmlFor="reclamo-respuesta" className="mb-1.5 block text-sm font-semibold text-slatey-700">Respuesta</label>
              <textarea id="reclamo-respuesta" rows={4} value={respuesta} onChange={(e) => setRespuesta(e.target.value.slice(0, 4000))} className={campo} />
            </div>
            <label className="flex min-h-[44px] items-center gap-3 text-sm text-slatey-700">
              <input type="checkbox" checked={resuelto} onChange={(e) => setResuelto(e.target.checked)} className="h-5 w-5 accent-primary-600" />
              Marcar como resuelto
            </label>
            {actual.citaId && (
              <label className="flex min-h-[44px] items-center gap-3 text-sm text-slatey-700">
                <input type="checkbox" checked={devolver} onChange={(e) => setDevolver(e.target.checked)} className="h-5 w-5 accent-primary-600" />
                Devolver el depósito de la cita al paciente
              </label>
            )}
            {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setActual(null)} disabled={enviando}>Volver</Button>
              <Button loading={enviando} onClick={enviar}>Enviar</Button>
            </div>
          </div>
        )}
      </Modal>
    </Seccion>
  );
}
