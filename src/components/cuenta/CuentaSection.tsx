import { useState } from 'react';
import { MailCheck, ShieldCheck, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button, Input, Modal, Badge } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import {
  obtenerYo, pedirCodigoCorreo, verificarCorreo, eliminarCuenta, misConsentimientos, politicaVigente,
} from '@/api/usuarios';
import { diaLima } from '@/lib/format';
import { useApp } from '@/storeHooks';

const mensaje = (e: unknown, defecto: string) => (e instanceof ApiError ? e.message : defecto);

/** Verificar correo (OTP), consentimientos de privacidad y eliminar cuenta. La usan el paciente y el odontólogo. */
export function CuentaSection({ onEliminada }: { onEliminada: () => void }) {
  const yo = useAsync(() => obtenerYo(), []);
  const { user, setUser } = useApp();
  const alVerificar = () => {
    setUser({ ...user, emailVerified: true }); // actualiza la insignia del encabezado sin recargar
    yo.reload();
  };
  return (
    <div className="space-y-4">
      {yo.loading ? (
        <div className="flex justify-center rounded-2xl border border-slatey-100 bg-white p-4" aria-busy="true">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" aria-label="Cargando cuenta" />
        </div>
      ) : yo.data ? (
        <VerificacionCorreo correo={yo.data.correo} verificado={!!yo.data.correoVerificado} onVerificado={alVerificar} />
      ) : null}
      <Privacidad />
      <EliminarCuenta onEliminada={onEliminada} />
    </div>
  );
}

function VerificacionCorreo({ correo, verificado, onVerificado }: { correo: string; verificado: boolean; onVerificado: () => void }) {
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState<'enviar' | 'verificar' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const enviar = async () => {
    setCargando('enviar');
    setMsg(null);
    try {
      await pedirCodigoCorreo();
      setEnviado(true);
      setMsg({ ok: true, texto: `Te enviamos un código de 6 dígitos a ${correo}. Vence en 15 minutos.` });
    } catch (e) {
      setMsg({ ok: false, texto: mensaje(e, 'No se pudo enviar el código.') });
    } finally {
      setCargando(null);
    }
  };

  const verificar = async () => {
    if (!/^\d{6}$/.test(codigo)) return setMsg({ ok: false, texto: 'El código tiene 6 dígitos.' });
    setCargando('verificar');
    setMsg(null);
    try {
      await verificarCorreo(codigo);
      setCodigo('');
      onVerificado();
    } catch (e) {
      setMsg({ ok: false, texto: mensaje(e, 'Código incorrecto o vencido.') });
    } finally {
      setCargando(null);
    }
  };

  return (
    <section aria-labelledby="titulo-correo" className="space-y-3 rounded-2xl border border-slatey-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id="titulo-correo" className="flex items-center gap-2 text-sm font-bold text-slatey-900">
          <MailCheck className="h-4 w-4 text-primary-600" aria-hidden="true" /> Correo
        </h3>
        <Badge variant={verificado ? 'success' : 'warning'} size="sm">{verificado ? 'Verificado' : 'Sin verificar'}</Badge>
      </div>
      <p className="break-all text-xs text-slatey-600">{correo}</p>
      {!verificado && (
        <>
          {enviado && (
            <Input label="Código de verificación" value={codigo} onChange={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} />
          )}
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-xs font-medium ${msg.ok ? 'text-success-700' : 'text-error-600'}`}>{msg.texto}</p>}
          <div className="grid grid-cols-1 gap-2">
            {enviado && (
              <Button size="sm" fullWidth loading={cargando === 'verificar'} disabled={codigo.length !== 6} onClick={verificar}>
                Verificar correo
              </Button>
            )}
            <Button size="sm" variant={enviado ? 'outline' : 'primary'} fullWidth loading={cargando === 'enviar'} onClick={enviar}>
              {enviado ? 'Reenviar código' : 'Enviar código'}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function Privacidad() {
  const consentimientos = useAsync(() => misConsentimientos(), []);
  const vigente = useAsync(() => politicaVigente(), []);
  const ultimo = consentimientos.data?.[0];
  const desactualizado = !!ultimo && !!vigente.data && ultimo.versionPolitica !== vigente.data.version;

  return (
    <section aria-labelledby="titulo-privacidad" className="space-y-2 rounded-2xl border border-slatey-100 bg-white p-4">
      <h3 id="titulo-privacidad" className="flex items-center gap-2 text-sm font-bold text-slatey-900">
        <ShieldCheck className="h-4 w-4 text-primary-600" aria-hidden="true" /> Privacidad (Ley N.º 29733)
      </h3>
      {consentimientos.loading ? (
        <p className="text-xs text-slatey-500">Cargando…</p>
      ) : consentimientos.error ? (
        <p role="alert" className="text-xs text-error-600">{consentimientos.error}</p>
      ) : ultimo ? (
        <p className="text-xs text-slatey-600">
          Aceptaste la política versión <strong>{ultimo.versionPolitica}</strong> el {diaLima(ultimo.aceptadoEn)}.
          {vigente.data && !desactualizado && ' Es la versión vigente.'}
        </p>
      ) : (
        <p className="text-xs text-slatey-600">No hay registro de aceptación.</p>
      )}
      {desactualizado && (
        <p className="text-xs font-medium text-accent-700">La política vigente es la versión {vigente.data?.version}.</p>
      )}
    </section>
  );
}

function EliminarCuenta({ onEliminada }: { onEliminada: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cerrar = () => {
    if (cargando) return;
    setAbierto(false);
    setConfirmacion('');
    setPassword('');
    setError(null);
  };

  const eliminar = async () => {
    if (confirmacion !== 'ELIMINAR') return setError('Escribe ELIMINAR en mayúsculas para confirmar.');
    setCargando(true);
    setError(null);
    try {
      await eliminarCuenta(confirmacion, password);
      setAbierto(false);
      onEliminada();
    } catch (e) {
      setError(mensaje(e, 'No se pudo eliminar la cuenta.'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <section aria-labelledby="titulo-eliminar" className="space-y-2 rounded-2xl border border-error-100 bg-white p-4">
      <h3 id="titulo-eliminar" className="flex items-center gap-2 text-sm font-bold text-error-700">
        <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar mi cuenta
      </h3>
      <p className="text-xs text-slatey-600">
        Se cancelan tus citas futuras y se borran tus datos personales. Se conservan, sin datos de contacto, las citas,
        pagos e historias clínicas que exige la ley.
      </p>
      <Button size="sm" variant="danger" fullWidth onClick={() => setAbierto(true)}>Eliminar cuenta</Button>

      <Modal open={abierto} onClose={cerrar} title="Eliminar cuenta">
        <div className="space-y-4">
          <div className="flex gap-2 rounded-xl bg-error-50 p-3 text-xs text-error-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <p>Esta acción no se puede deshacer.</p>
          </div>
          <Input label="Escribe ELIMINAR para confirmar" value={confirmacion} onChange={setConfirmacion} autoComplete="off" />
          <Input label="Contraseña (si entras con Google, déjala vacía)" value={password} onChange={setPassword} type="password" autoComplete="current-password" />
          {error && <p role="alert" className="text-xs font-semibold text-error-600">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={cerrar} disabled={cargando}>Volver</Button>
            <Button variant="danger" loading={cargando} disabled={confirmacion !== 'ELIMINAR'} onClick={eliminar}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
