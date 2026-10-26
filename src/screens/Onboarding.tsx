import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, User, Stethoscope, Phone, IdCard, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../storeHooks';
import { login, register, loginConGoogle, registroConGoogle, recuperarPassword, restablecerPassword, type AuthSession } from '@/api/auth';
import { ApiError } from '@/api/http';
import GoogleButton from '../components/GoogleButton';
import { Modal, Button } from '../components/ui';

export default function Onboarding() {
  const { setScreen, setUser, setRole: setAppRole, setIsAuth, user } = useApp();
  const [role, setRole] = useState<'patient' | 'dentist'>('patient');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [copNumber, setCopNumber] = useState(''); // Estado para la colegiatura COP
  const [docType, setDocType] = useState<'DNI' | 'CE'>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  // Olvidé mi contraseña: 'correo' (pedir código) → 'codigo' (código + contraseña nueva) → 'listo'
  const [recovery, setRecovery] = useState<null | 'correo' | 'codigo' | 'listo'>(null);
  const [recCorreo, setRecCorreo] = useState('');
  const [recCodigo, setRecCodigo] = useState('');
  const [recPass, setRecPass] = useState('');
  const [recMsg, setRecMsg] = useState<string | null>(null);
  const [recBusy, setRecBusy] = useState(false);
  // Cuenta de Google nueva: falta documento, teléfono y rol antes de crear la cuenta.
  const [googlePending, setGooglePending] = useState<{ idToken: string; correo: string; nombre: string } | null>(null);

  /** Deja la app lista tras un login/registro exitoso (el rol real lo manda el servidor, no el selector). */
  const entrar = async (session: AuthSession) => {
    const realRole = session.rol === 'ODONTOLOGO' ? 'dentist' : 'patient';
    setAppRole(realRole);
    setUser({ ...user, fullName: session.nombreCompleto, email: email.trim() });
    setIsAuth(true);
    setScreen(realRole === 'patient' ? 'patientDashboard' : 'dentistPanel');
    // El store carga el perfil completo (documento, teléfono) con /api/usuarios/yo al abrirse la sesión.
  };

  const rolBackend = role === 'dentist' ? 'ODONTOLOGO' : 'PACIENTE';

  const abrirRecuperacion = () => {
    setRecCorreo(email.trim());
    setRecCodigo('');
    setRecPass('');
    setRecMsg(null);
    setRecovery('correo');
  };

  const pedirCodigo = async () => {
    if (recBusy) return;
    const correo = recCorreo.trim();
    if (!correo) return setRecMsg('Ingresa tu correo.');
    setRecBusy(true);
    setRecMsg(null);
    try {
      await recuperarPassword(correo); // 202 siempre: no revela si el correo existe
      setRecovery('codigo');
    } catch (err) {
      setRecMsg(err instanceof ApiError ? err.message : 'No se pudo enviar el código.');
    } finally {
      setRecBusy(false);
    }
  };

  const cambiarPassword = async () => {
    if (recBusy) return;
    if (!/^\d{6}$/.test(recCodigo)) return setRecMsg('El código tiene 6 dígitos.');
    if (recPass.length < 8) return setRecMsg('La contraseña debe tener al menos 8 caracteres.');
    setRecBusy(true);
    setRecMsg(null);
    try {
      await restablecerPassword(recCorreo.trim(), recCodigo, recPass);
      setEmail(recCorreo.trim());
      setPassword('');
      setRecovery('listo');
    } catch (err) {
      setRecMsg(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setRecBusy(false);
    }
  };

  const validarDatosExtra = (): string | null => {
    if (!docNumber.trim() || !phone.trim()) return 'Completa tu documento y teléfono.';
    if (role === 'dentist' && !copNumber.trim()) return 'Ingresa tu número de colegiatura COP.';
    if (!acceptPrivacy) return 'Debes aceptar la política de privacidad para continuar.';
    return null;
  };

  const handleGoogleCredential = async (idToken: string) => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const r = await loginConGoogle(idToken);
      if (r.estado === 'sesion') {
        await entrar(r.sesion);
      } else {
        setGooglePending({ idToken, correo: r.correo, nombre: r.nombreCompleto });
        setIsRegister(true);
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 503)) {
        setError('El inicio con Google todavía no está disponible. Usa tu correo y contraseña.');
      } else {
        setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (googlePending) {
      const falta = validarDatosExtra();
      if (falta) return setError(falta);
      setLoading(true);
      try {
        const sesion = await registroConGoogle(googlePending.idToken, {
          rol: rolBackend,
          tipoDocumento: docType,
          numeroDocumento: docNumber.trim(),
          telefono: phone.trim(),
          numeroColegiatura: role === 'dentist' ? copNumber.trim() : undefined,
          aceptaPrivacidad: true,
        });
        await entrar(sesion);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setGooglePending(null);
          setError('Tu sesión de Google venció. Pulsa «Continuar con Google» otra vez.');
        } else {
          setError(err instanceof ApiError ? err.message : 'No se pudo completar la solicitud.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isRegister) {
      if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
      if (!fullName.trim()) return setError('Completa tus datos.');
      const falta = validarDatosExtra();
      if (falta) return setError(falta);
    }

    setLoading(true);
    // timeout 10s for login/register
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const session = isRegister
        ? await register({
            numeroDocumento: docNumber.trim(),
            tipoDocumento: docType,
            nombreCompleto: fullName.trim(),
            telefono: phone.trim(),
            correo: email.trim(),
            password,
            rol: rolBackend,
            numeroColegiatura: role === 'dentist' ? copNumber.trim() : undefined,
            aceptaPrivacidad: true,
          })
        : await login(email.trim(), password, controller.signal);
      await entrar(session);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('El servidor tardó en responder');
      } else {
        setError(err instanceof ApiError ? err.message : 'No se pudo completar la solicitud.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slatey-50 flex flex-col justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-64 bg-gradient-to-b from-primary-50 to-transparent -z-10" />

      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Header App Brand */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ y: [0, -3, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-primary-500/20 overflow-hidden"
          >
            <img src="/System_(3).png" alt="OdontoSystem" className="w-11 h-11 object-contain" />
          </motion.div>
          <div>
            <h1 className="text-xl font-black text-slatey-900 font-display leading-tight">OdontoSystem</h1>
            <p className="text-xs text-slatey-500 font-medium">Tu sonrisa, en buenas manos</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl p-6 border border-slatey-100 shadow-xl shadow-slatey-200/50 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slatey-900 font-display">
              {googlePending ? 'Completa tu perfil' : isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
            </h2>
            <p className="text-xs text-slatey-500 mt-1">
              {googlePending
                ? `Hola${googlePending.nombre ? `, ${googlePending.nombre}` : ''}. Necesitamos unos datos más para crear tu cuenta.`
                : isRegister
                ? 'Regístrate para reservar o gestionar consultas'
                : 'Ingresa tus credenciales para continuar'}
            </p>
          </div>

          {/* Selector de Rol */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slatey-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                role === 'patient'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slatey-600 hover:text-slatey-900'
              }`}
            >
              <User className="w-4 h-4" />
              Soy Paciente
            </button>
            <button
              type="button"
              onClick={() => setRole('dentist')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                role === 'dentist'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slatey-600 hover:text-slatey-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Soy Odontólogo
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && !googlePending && (
              <div className="space-y-1">
                <label htmlFor="ob-nombre" className="text-xs font-bold text-slatey-700 block">Nombre Completo</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="ob-nombre"
                    autoComplete="name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. María González"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <>
                <div className="grid grid-cols-[88px_1fr] gap-2">
                  <div className="space-y-1">
                    <label htmlFor="ob-tipo-doc" className="text-xs font-bold text-slatey-700 block">Documento</label>
                    <select
                    id="ob-tipo-doc"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as 'DNI' | 'CE')}
                      className="w-full py-3 px-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="ob-num-doc" className="text-xs font-bold text-slatey-700 block">N.º de documento</label>
                    <div className="relative">
                      <IdCard className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                    id="ob-num-doc"
                        type="text"
                        inputMode="numeric"
                        maxLength={20}
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="12345678"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="ob-telefono" className="text-xs font-bold text-slatey-700 block">Teléfono</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                    id="ob-telefono"
                    autoComplete="tel"
                      type="tel"
                      inputMode="tel"
                      maxLength={20}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+51 999 999 999"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {!googlePending && (<>
            <div className="space-y-1">
              <label htmlFor="ob-correo" className="text-xs font-bold text-slatey-700 block">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                    id="ob-correo"
                    autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="ob-password" className="text-xs font-bold text-slatey-700 block">Contraseña</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                    id="ob-password"
                    autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-slatey-500 hover:text-slatey-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
            </>)}

            {isRegister && role === 'dentist' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <label htmlFor="ob-cop" className="text-xs font-bold text-slatey-700 block">N.º de Colegiatura COP</label>
                <div className="relative">
                  <Shield className="w-5 h-5 text-slatey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="ob-cop"
                    type="text"
                    value={copNumber}
                    onChange={(e) => setCopNumber(e.target.value)}
                    placeholder="COP-12345"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm uppercase"
                  />
                </div>
                <p className="text-[11px] text-slatey-500 font-medium">
                  Verificamos en tiempo real con el registro oficial COP.
                </p>
              </motion.div>
            )}

            {isRegister && (
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slatey-600 font-medium leading-relaxed">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="mt-0.5 rounded border-slatey-300 text-primary-500 focus:ring-primary-400"
                />
                <span>Acepto la política de privacidad y el tratamiento de mis datos personales (Ley 29733).</span>
              </label>
            )}

            {!isRegister && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slatey-600 font-medium">
                  <input type="checkbox" className="rounded border-slatey-300 text-primary-500 focus:ring-primary-400" />
                  Recordarme
                </label>
                <button type="button" onClick={abrirRecuperacion} className="text-primary-600 font-bold hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-2xl bg-error-50 border border-error-100 px-3.5 py-3 text-xs font-medium text-error-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isRegister && !acceptPrivacy)}
              className="disabled:opacity-60 w-full py-3.5 px-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {googlePending ? 'Crear mi cuenta' : isRegister ? 'Registrarse' : 'Iniciar sesión'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {googlePending ? (
            <button
              type="button"
              onClick={() => { setGooglePending(null); setIsRegister(false); setError(null); }}
              className="w-full text-center text-xs font-bold text-slatey-500 hover:text-slatey-700"
            >
              Cancelar y volver
            </button>
          ) : (
            <>
              {/* Social / Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slatey-100" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slatey-500">o</span>
                </div>
              </div>

              <GoogleButton onCredential={handleGoogleCredential} disabled={loading} />
            </>
          )}

          {/* Switch Register/Login */}
          <p className="text-center text-xs text-slatey-500 pt-2">
            {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-primary-600 font-bold hover:underline"
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>

      <Modal
        open={recovery !== null}
        onClose={() => !recBusy && setRecovery(null)}
        title={recovery === 'listo' ? 'Contraseña actualizada' : 'Recuperar contraseña'}
      >
        <div className="space-y-4">
          {recovery === 'correo' && (
            <>
              <p className="text-sm text-slatey-600">Te enviaremos un código de 6 dígitos a tu correo. Vale 15 minutos.</p>
              <input
                type="email"
                value={recCorreo}
                aria-label="Correo electrónico"
                autoComplete="email"
                onChange={(e) => setRecCorreo(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="w-full px-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-500 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </>
          )}
          {recovery === 'codigo' && (
            <>
              <p className="text-sm text-slatey-600">
                Si <strong>{recCorreo}</strong> tiene una cuenta, te enviamos un código. Revisa también la carpeta de spam.
              </p>
              <input
                inputMode="numeric"
                maxLength={6}
                value={recCodigo}
                aria-label="Código de 6 dígitos"
                autoComplete="one-time-code"
                onChange={(e) => setRecCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Código de 6 dígitos"
                className="w-full px-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 tracking-widest placeholder:tracking-normal placeholder:text-slatey-500 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <input
                type="password"
                value={recPass}
                aria-label="Contraseña nueva"
                autoComplete="new-password"
                onChange={(e) => setRecPass(e.target.value)}
                placeholder="Contraseña nueva (mín. 8 caracteres)"
                className="w-full px-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-200 text-slatey-900 placeholder:text-slatey-500 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <button type="button" onClick={pedirCodigo} disabled={recBusy} className="text-xs font-bold text-primary-600 hover:underline disabled:opacity-50">
                Reenviar código (puedes pedir uno cada 60 s)
              </button>
            </>
          )}
          {recovery === 'listo' && (
            <p className="text-sm text-slatey-600">Cambiaste tu contraseña y cerramos tus otras sesiones. Ya puedes iniciar sesión.</p>
          )}
          {recMsg && <p role="alert" className="text-xs font-semibold text-error-600">{recMsg}</p>}
          {recovery === 'correo' && <Button fullWidth size="lg" loading={recBusy} onClick={pedirCodigo}>Enviar código</Button>}
          {recovery === 'codigo' && <Button fullWidth size="lg" loading={recBusy} onClick={cambiarPassword}>Cambiar contraseña</Button>}
          {recovery === 'listo' && <Button fullWidth size="lg" onClick={() => setRecovery(null)}>Iniciar sesión</Button>}
        </div>
      </Modal>
    </div>
  );
}