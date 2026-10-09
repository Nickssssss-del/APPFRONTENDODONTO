import { useCallback, useEffect, useState } from 'react';
import { API_URL, ApiError } from '@/api/http';
import { login, logout } from '@/api/auth';
import { buscarOdontologos, listarDistritos, type OdontologoTarjeta } from '@/api/catalog';
import { obtenerYo, type UsuarioYo } from '@/api/usuarios';
import { listarFotosConsultorio, type FotoConsultorio } from '@/api/archivos';
import SmartImage from '@/components/SmartImage';

/**
 * Pantalla de diagnóstico: abre  http://localhost:5173/?diagnostico=1
 * Comprueba paso a paso la conexión app → backend → base de datos → Cloudinary y dice QUÉ corregir.
 * No necesita sesión. Bórrala (y su línea en main.tsx) antes de publicar.
 */

type Estado = 'espera' | 'ok' | 'error' | 'aviso';
type Check = { titulo: string; estado: Estado; detalle?: string; pista?: string };

const ENDPOINTS_NUEVOS = ['/api/auth/login', '/api/odontologos', '/api/catalogos/distritos', '/api/usuarios/yo', '/api/citas/mias'];

const color: Record<Estado, string> = {
  espera: 'bg-slate-200 text-slate-600',
  ok: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-700',
  aviso: 'bg-amber-100 text-amber-800',
};
const icono: Record<Estado, string> = { espera: '…', ok: '✓', error: '✕', aviso: '!' };

export default function DiagnosticoConexion() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [odontologos, setOdontologos] = useState<OdontologoTarjeta[]>([]);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [sesion, setSesion] = useState<{ yo: UsuarioYo; fotos: FotoConsultorio[] | null } | null>(null);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const agregar = (c: Check) => setChecks((prev) => [...prev, c]);

  const correr = useCallback(async () => {
    setChecks([]);
    setOdontologos([]);
    const origen = window.location.origin;
    const apuntaLocal = /localhost|127\.0\.0\.1/.test(API_URL);
    const appLocal = /localhost|127\.0\.0\.1/.test(origen);

    // 1) URL configurada
    agregar({
      titulo: 'URL del backend configurada',
      estado: apuntaLocal ? (appLocal ? 'aviso' : 'error') : 'ok',
      detalle: API_URL,
      pista: apuntaLocal
        ? 'La app apunta a tu propia máquina. Eso solo es correcto si corres el backend en tu PC. Si usas el de Railway, crea el archivo .env en la raíz con VITE_API_URL=https://odontosystem-production.up.railway.app y reinicia npm run dev.'
        : undefined,
    });

    // 2) ¿El backend responde? + 3) ¿tiene los endpoints nuevos?
    let paths: string[] | null = null;
    try {
      const r = await fetch(`${API_URL}/v3/api-docs`);
      if (r.ok) {
        paths = Object.keys(((await r.json()) as { paths?: Record<string, unknown> }).paths ?? {});
        agregar({ titulo: 'El backend responde', estado: 'ok', detalle: `${API_URL} → HTTP ${r.status}` });
      } else {
        agregar({ titulo: 'El backend responde', estado: 'aviso', detalle: `HTTP ${r.status} en /v3/api-docs`, pista: 'El servidor está vivo, pero la documentación está desactivada (SWAGGER_ENABLED=false) o la ruta no existe.' });
      }
    } catch {
      agregar({
        titulo: 'El backend responde',
        estado: 'error',
        detalle: 'No se pudo conectar (el navegador bloqueó la petición).',
        pista: `Abre ${API_URL}/swagger-ui/index.html en otra pestaña. Si ABRE, es CORS: en Railway agrega ${origen} a CORS_ALLOWED_ORIGINS (separado por coma). Si NO abre, el backend está apagado o la URL está mal escrita.`,
      });
    }

    if (paths) {
      const faltan = ENDPOINTS_NUEVOS.filter((e) => !paths!.some((p) => p === e || p.startsWith(`${e}/`)));
      agregar({
        titulo: 'El backend desplegado tiene los endpoints nuevos',
        estado: faltan.length === 0 ? 'ok' : 'error',
        detalle: faltan.length === 0 ? `${paths.length} rutas publicadas` : `Faltan: ${faltan.join(', ')}`,
        pista: faltan.length
          ? 'Railway está desplegando una versión ANTERIOR del backend. Haz merge de la rama feature/chatbot-recordatorios a la rama que despliega Railway (o cambia la rama en Railway → Settings → Source) y espera el nuevo deploy.'
          : undefined,
      });
    }

    // 4) Catálogos
    try {
      const d = await listarDistritos();
      agregar({ titulo: 'Catálogos (distritos)', estado: 'ok', detalle: `${d.length} distritos: ${d.slice(0, 4).join(', ')}…` });
    } catch (e) {
      agregar({ titulo: 'Catálogos (distritos)', estado: 'error', detalle: e instanceof ApiError ? `${e.status} · ${e.message}` : 'Error', pista: 'GET /api/catalogos/distritos debe ser público. Si da 404, falta desplegar la versión nueva.' });
    }

    // 5) Odontólogos reales + fotos
    try {
      const p = await buscarOdontologos({ tamano: 6 });
      setOdontologos(p.contenido);
      agregar({
        titulo: 'Odontólogos desde la base de datos',
        estado: p.totalElementos > 0 ? 'ok' : 'aviso',
        detalle: `${p.totalElementos} en total (se muestran ${p.contenido.length} abajo)`,
        pista: p.totalElementos === 0 ? 'La base está vacía o los odontólogos no están verificados/activos. Revisa que ejecutaste el script de datos.' : undefined,
      });
    } catch (e) {
      agregar({ titulo: 'Odontólogos desde la base de datos', estado: 'error', detalle: e instanceof ApiError ? `${e.status} · ${e.message}` : 'Error', pista: 'Si es 404, falta desplegar la versión nueva del backend. Si es 500, mira los logs en Railway.' });
    }
  }, []);

  useEffect(() => {
    void correr();
  }, [correr]);

  const probarLogin = async () => {
    setErrorLogin(null);
    setCargando(true);
    try {
      await login(correo.trim(), password);
      const yo = await obtenerYo();
      let fotos: FotoConsultorio[] | null = null;
      if (yo.rol === 'ODONTOLOGO') fotos = await listarFotosConsultorio().catch(() => null);
      setSesion({ yo, fotos });
    } catch (e) {
      setErrorLogin(e instanceof ApiError ? `${e.status} · ${e.message}` : 'No se pudo completar el inicio de sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 p-4 text-slate-900">
      <h1 className="text-lg font-extrabold">Diagnóstico de conexión</h1>
      <p className="mb-4 text-xs text-slate-500">App → backend → base de datos → Cloudinary. Esta pantalla es solo para pruebas.</p>

      <ul className="space-y-2">
        {checks.map((c, i) => (
          <li key={i} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color[c.estado]}`}>{icono[c.estado]}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{c.titulo}</p>
                {c.detalle && <p className="break-words text-xs text-slate-600">{c.detalle}</p>}
                {c.pista && <p className="mt-1 break-words rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{c.pista}</p>}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button onClick={() => void correr()} className="mt-3 w-full rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold">Repetir pruebas</button>

      {odontologos.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-bold">¿Se ven las fotos de perfil? (vienen de Supabase → Cloudinary)</h2>
          <div className="grid grid-cols-3 gap-2">
            {odontologos.map((o) => (
              <div key={o.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <SmartImage src={o.fotoUrl} alt={o.nombre} ratio="1/1" fallback="avatar" gravity="face" widths={[160, 320]} sizes="33vw" />
                <p className="truncate px-1.5 py-1 text-[10px] font-semibold">{o.nombre}</p>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Las que muestran iniciales no tienen foto cargada o su URL no abre.</p>
        </section>
      )}

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-sm font-bold">Probar inicio de sesión</h2>
        {!sesion ? (
          <div className="space-y-2">
            <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="contraseña" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={() => void probarLogin()} disabled={cargando} className="w-full rounded-xl bg-teal-600 py-2 text-sm font-bold text-white disabled:opacity-60">
              {cargando ? 'Probando…' : 'Iniciar sesión y leer mi perfil'}
            </button>
            {errorLogin && <p role="alert" className="text-xs font-medium text-red-600">{errorLogin}</p>}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <SmartImage src={sesion.yo.fotoPerfilUrl} alt={sesion.yo.nombreCompleto} ratio="1/1" fallback="avatar" gravity="face" widths={[160, 320]} sizes="64px" className="h-16 w-16 rounded-xl" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{sesion.yo.nombreCompleto}</p>
                <p className="text-xs text-slate-500">{sesion.yo.rol} · {sesion.yo.correo}</p>
              </div>
            </div>
            {sesion.fotos && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-bold">Fotos del consultorio: {sesion.fotos.length}</p>
                <div className="grid grid-cols-3 gap-2">
                  {sesion.fotos.map((f, i) => (
                    <SmartImage key={f.id} src={f.url} alt={`Consultorio ${i + 1}`} ratio="1/1" fallback="clinic" widths={[160, 320]} sizes="33vw" className="rounded-lg" />
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => { logout(); setSesion(null); }} className="mt-3 w-full rounded-xl border border-slate-300 py-2 text-xs font-bold">Cerrar sesión de prueba</button>
          </div>
        )}
      </section>
    </div>
  );
}
