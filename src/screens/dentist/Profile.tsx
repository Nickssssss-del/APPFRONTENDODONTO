import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Camera, User, Mail, Phone, BadgeCheck, CreditCard, Clock, Plus, X, Check, AlertTriangle, FileText, Upload,
  Shield, AlertCircle, CheckCircle2, MapPin, Building2, Loader2, Trash2, CalendarOff, Stethoscope, Pencil, LogOut,
} from 'lucide-react';
import { Button, Input, Badge, Toggle } from '@/components/ui';
import { useApp } from '@/store';
import SmartImage from '@/components/SmartImage';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/api/http';
import { actualizarYo } from '@/api/usuarios';
import {
  agregarFotoConsultorio, eliminarFotoConsultorio, listarDocumentos, listarFotosConsultorio, subirDocumento, subirFotoPerfil,
  validarImagen, type TipoDocumento,
} from '@/api/archivos';
import { listarCategorias, listarDistritos, listarEspecialidades, type ServicioApi } from '@/api/catalog';
import {
  actualizarMiPerfil, actualizarServicio, crearBloqueo, crearServicio, desactivarServicio, DIAS_SEMANA, eliminarBloqueo,
  guardarHorarios, misBloqueos, misHorarios, miPerfil, misServicios, reintentarVerificacion, type DiaSemanaApi, type EstadoVerificacion,
} from '@/api/panel';
import { diaLima, horaLima, soles } from '@/lib/format';

/* ───────── helpers ───────── */
const hhmm = (t: string) => t.slice(0, 5);
type Tramo = { start: string; end: string; intervalo?: number | null };
type Semana = Record<DiaSemanaApi, Tramo[]>;
const SEMANA_VACIA = (): Semana => ({ LUNES: [], MARTES: [], MIERCOLES: [], JUEVES: [], VIERNES: [], SABADO: [], DOMINGO: [] });
const msg = (e: unknown, def: string) => (e instanceof ApiError ? e.message : def);

const VERIF: Record<EstadoVerificacion, { label: string; variant: 'success' | 'warning' | 'error'; texto: string }> = {
  VERIFICADO: { label: 'Verificado', variant: 'success', texto: 'Tu colegiatura fue verificada. Ya apareces en el buscador.' },
  PENDIENTE: { label: 'En revisión', variant: 'warning', texto: 'Estamos verificando tu colegiatura (COP). Se reintenta sola; también puedes reintentar ahora.' },
  OBSERVADO: { label: 'Observado', variant: 'error', texto: 'Tu verificación tiene observaciones. Sube de nuevo tus documentos.' },
  RECHAZADO: { label: 'Rechazado', variant: 'error', texto: 'No pudimos verificar tu colegiatura. Sube de nuevo tus documentos o contacta a soporte.' },
};

const DOCS: { tipo: TipoDocumento; label: string }[] = [
  { tipo: 'DNI', label: 'DNI (frente y dorso)' },
  { tipo: 'TITULO_PROFESIONAL', label: 'Título profesional' },
  { tipo: 'COLEGIATURA', label: 'Colegiatura (COP)' },
  { tipo: 'CV', label: 'Currículum Vitae (PDF)' },
];

function Seccion({ icono, titulo, derecha, children }: { icono: ReactNode; titulo: string; derecha?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slatey-100 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><span className="text-primary-500">{icono}</span><h3 className="text-sm font-bold text-slatey-900">{titulo}</h3></div>
        {derecha}
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, setUser, logout, setScreen } = useApp();
  const perfil = useAsync(() => miPerfil(), []);
  const catalogos = useAsync(async () => {
    const [especialidades, distritos, categorias] = await Promise.all([listarEspecialidades(), listarDistritos(), listarCategorias()]);
    return { especialidades, distritos, categorias };
  }, []);

  // ── datos personales y del consultorio ──
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [consultorio, setConsultorio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [distrito, setDistrito] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [ruc, setRuc] = useState('');
  const [cci, setCci] = useState('');
  const [confirmacionManual, setConfirmacionManual] = useState(false);
  const [especialidadIds, setEspecialidadIds] = useState<number[]>([]);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    const d = perfil.data;
    if (!d) return;
    setConsultorio(d.perfil.consultorio ?? '');
    setDireccion(d.perfil.direccion ?? '');
    setDistrito(d.perfil.distrito ?? '');
    setRuc(d.ruc ?? '');
    setCci(d.cci ?? '');
    setConfirmacionManual(d.perfil.requiereConfirmacionManual);
    setEspecialidadIds(d.perfil.especialidades.map((e) => Number(e.id)));
    if (d.perfil.latitud != null && d.perfil.longitud != null) setCoords({ lat: Number(d.perfil.latitud), lng: Number(d.perfil.longitud) });
  }, [perfil.data]);
  useEffect(() => {
    setNombre(user.fullName);
    setTelefono(user.phone);
  }, [user.fullName, user.phone]);

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) return setMsgPerfil({ ok: false, texto: 'Tu navegador no permite obtener la ubicación.' });
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) }),
      () => setMsgPerfil({ ok: false, texto: 'No pudimos obtener tu ubicación. Revisa el permiso del navegador.' }),
    );
  };

  const guardarPerfil = async () => {
    if (guardandoPerfil) return;
    setGuardandoPerfil(true);
    setMsgPerfil(null);
    try {
      if (nombre.trim() !== user.fullName || telefono.trim() !== user.phone) {
        const yo = await actualizarYo({ nombreCompleto: nombre.trim() || undefined, telefono: telefono.trim() || undefined });
        setUser({ ...user, fullName: yo.nombreCompleto, phone: yo.telefono ?? '' });
      }
      await actualizarMiPerfil({
        nombreConsultorio: consultorio.trim(),
        direccionConsultorio: direccion.trim(),
        distritoConsultorio: distrito.trim(),
        ...(coords ? { latitud: coords.lat, longitud: coords.lng } : {}),
        especialidadIds,
        requiereConfirmacionManual: confirmacionManual,
        ruc: ruc.trim(),
        cci: cci.trim(),
      });
      setMsgPerfil({ ok: true, texto: 'Cambios guardados.' });
      perfil.reload();
    } catch (e) {
      setMsgPerfil({ ok: false, texto: msg(e, 'No se pudieron guardar los cambios.') });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // ── fotos ──
  const fotos = useAsync(() => listarFotosConsultorio(), []);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const galeriaInput = useRef<HTMLInputElement>(null);
  const perfilInput = useRef<HTMLInputElement>(null);
  const listaFotos = [...(fotos.data ?? [])].sort((a, b) => a.orden - b.orden);

  const agregarFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validarImagen(file);
    if (err) return setFotoError(err);
    setSubiendo(true);
    setFotoError(null);
    try {
      await agregarFotoConsultorio(file);
      fotos.reload();
    } catch (error) {
      setFotoError(msg(error, 'No se pudo subir la foto.'));
    } finally {
      setSubiendo(false);
    }
  };
  const quitarFoto = async (id: string) => {
    try {
      await eliminarFotoConsultorio(id);
      fotos.reload();
    } catch (error) {
      setFotoError(msg(error, 'No se pudo eliminar la foto.'));
    }
  };
  const cambiarFotoPerfil = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validarImagen(file);
    if (err) return setFotoError(err);
    try {
      const r = await subirFotoPerfil(file);
      setUser({ ...user, photoUrl: r.fotoPerfilUrl });
      setFotoError(null);
    } catch (error) {
      setFotoError(msg(error, 'No se pudo cambiar la foto de perfil.'));
    }
  };

  // ── verificación y documentos ──
  const docs = useAsync(() => listarDocumentos(), []);
  const [subiendoDoc, setSubiendoDoc] = useState<TipoDocumento | null>(null);
  const [msgVerif, setMsgVerif] = useState<{ ok: boolean; texto: string } | null>(null);
  const subirDoc = async (tipo: TipoDocumento, file: File) => {
    setSubiendoDoc(tipo);
    setMsgVerif(null);
    try {
      await subirDocumento(tipo, file);
      docs.reload();
      setMsgVerif({ ok: true, texto: 'Documento enviado.' });
    } catch (e) {
      setMsgVerif({ ok: false, texto: msg(e, 'No se pudo subir el documento (PDF, JPG o PNG de hasta 5 MB).') });
    } finally {
      setSubiendoDoc(null);
    }
  };
  const reintentar = async () => {
    setMsgVerif(null);
    try {
      await reintentarVerificacion();
      perfil.reload();
      setMsgVerif({ ok: true, texto: 'Verificación reintentada.' });
    } catch (e) {
      setMsgVerif({ ok: false, texto: msg(e, 'No se pudo reintentar ahora.') });
    }
  };

  // ── horarios ──
  const [semana, setSemana] = useState<Semana>(SEMANA_VACIA());
  const [guardandoHorario, setGuardandoHorario] = useState(false);
  const [msgHorario, setMsgHorario] = useState<{ ok: boolean; texto: string } | null>(null);
  const horarios = useAsync(() => misHorarios(), []);
  useEffect(() => {
    if (!horarios.data) return;
    const s = SEMANA_VACIA();
    for (const h of horarios.data) {
      const dia = h.diaSemana as DiaSemanaApi;
      if (s[dia]) s[dia].push({ start: hhmm(h.horaInicio), end: hhmm(h.horaFin), intervalo: h.intervaloMinutos ?? null });
    }
    for (const d of Object.keys(s) as DiaSemanaApi[]) s[d].sort((a, b) => a.start.localeCompare(b.start));
    setSemana(s);
  }, [horarios.data]);

  const toggleDia = (d: DiaSemanaApi) =>
    setSemana((p) => ({ ...p, [d]: p[d].length ? [] : [{ start: '09:00', end: '18:00', intervalo: null }] }));
  const cambiarTramo = (d: DiaSemanaApi, i: number, campo: 'start' | 'end', v: string) =>
    setSemana((p) => ({ ...p, [d]: p[d].map((t, k) => (k === i ? { ...t, [campo]: v } : t)) }));
  const agregarTramo = (d: DiaSemanaApi) =>
    setSemana((p) => {
      const ult = p[d][p[d].length - 1];
      return { ...p, [d]: [...p[d], { start: ult ? ult.end : '09:00', end: ult && ult.end < '20:00' ? '20:00' : '18:00', intervalo: null }] };
    });
  const quitarTramo = (d: DiaSemanaApi, i: number) => setSemana((p) => ({ ...p, [d]: p[d].filter((_, k) => k !== i) }));

  const guardarSemana = async () => {
    if (guardandoHorario) return;
    for (const d of DIAS_SEMANA) {
      for (const t of semana[d.api]) {
        if (!t.start || !t.end || t.end <= t.start) return setMsgHorario({ ok: false, texto: `${d.label}: la hora de fin debe ser posterior a la de inicio.` });
      }
    }
    setGuardandoHorario(true);
    setMsgHorario(null);
    try {
      const lista = DIAS_SEMANA.flatMap((d) =>
        semana[d.api].map((t) => ({ diaSemana: d.api, horaInicio: t.start, horaFin: t.end, intervaloMinutos: t.intervalo ?? undefined })),
      );
      await guardarHorarios(lista);
      setMsgHorario({ ok: true, texto: 'Horario guardado.' });
      horarios.reload();
    } catch (e) {
      setMsgHorario({ ok: false, texto: msg(e, 'No se pudo guardar el horario.') });
    } finally {
      setGuardandoHorario(false);
    }
  };

  // ── bloqueos ──
  const bloqueos = useAsync(() => misBloqueos(), []);
  const [bIni, setBIni] = useState('');
  const [bFin, setBFin] = useState('');
  const [bMotivo, setBMotivo] = useState('');
  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false);
  const [msgBloqueo, setMsgBloqueo] = useState<{ ok: boolean; texto: string } | null>(null);
  const crearBloqueoClick = async () => {
    if (!bIni || !bFin) return setMsgBloqueo({ ok: false, texto: 'Indica desde y hasta cuándo no atenderás.' });
    if (bFin <= bIni) return setMsgBloqueo({ ok: false, texto: 'La fecha final debe ser posterior a la inicial.' });
    if (!window.confirm('Las citas ya reservadas en ese rango se cancelarán con reembolso del 100 % y cada paciente recibirá un correo. ¿Continuar?')) return;
    setGuardandoBloqueo(true);
    setMsgBloqueo(null);
    try {
      // Lima es UTC-5 todo el año (sin horario de verano).
      const r = await crearBloqueo(`${bIni}:00-05:00`, `${bFin}:00-05:00`, bMotivo.trim() || undefined);
      setBIni(''); setBFin(''); setBMotivo('');
      setMsgBloqueo({ ok: true, texto: r.citasCanceladas > 0 ? `Agenda bloqueada. Se cancelaron ${r.citasCanceladas} cita(s) con reembolso.` : 'Agenda bloqueada.' });
      bloqueos.reload();
    } catch (e) {
      setMsgBloqueo({ ok: false, texto: msg(e, 'No se pudo bloquear la agenda.') });
    } finally {
      setGuardandoBloqueo(false);
    }
  };
  const quitarBloqueo = async (id: string) => {
    try {
      await eliminarBloqueo(id);
      bloqueos.reload();
    } catch (e) {
      setMsgBloqueo({ ok: false, texto: msg(e, 'No se pudo quitar el bloqueo.') });
    }
  };

  // ── servicios ──
  const servicios = useAsync(() => misServicios(), []);
  const [editando, setEditando] = useState<ServicioApi | 'nuevo' | null>(null);
  const [sTitulo, setSTitulo] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sCategoria, setSCategoria] = useState<number | ''>('');
  const [sPrecio, setSPrecio] = useState('');
  const [sDuracion, setSDuracion] = useState('');
  const [guardandoServ, setGuardandoServ] = useState(false);
  const [msgServ, setMsgServ] = useState<{ ok: boolean; texto: string } | null>(null);
  const abrirServicio = (s: ServicioApi | 'nuevo') => {
    setEditando(s);
    setMsgServ(null);
    if (s === 'nuevo') { setSTitulo(''); setSDesc(''); setSCategoria(''); setSPrecio(''); setSDuracion('30'); }
    else { setSTitulo(s.titulo); setSDesc(s.descripcion ?? ''); setSCategoria(s.categoriaId); setSPrecio(String(s.precioTotal)); setSDuracion(String(s.duracionMinutos)); }
  };
  const guardarServicio = async () => {
    if (!editando || guardandoServ) return;
    const precio = Number(sPrecio.replace(',', '.'));
    const duracion = Number(sDuracion);
    if (!sTitulo.trim() || sCategoria === '' || !Number.isFinite(precio) || precio < 0 || !Number.isInteger(duracion) || duracion < 5 || duracion > 480) {
      return setMsgServ({ ok: false, texto: 'Completa título, categoría, precio y una duración entre 5 y 480 minutos.' });
    }
    setGuardandoServ(true);
    setMsgServ(null);
    try {
      const datos = { categoriaId: Number(sCategoria), titulo: sTitulo.trim(), descripcion: sDesc.trim() || undefined, precioTotal: precio, duracionMinutos: duracion };
      if (editando === 'nuevo') await crearServicio(datos);
      else await actualizarServicio(editando.id, datos);
      setEditando(null);
      servicios.reload();
    } catch (e) {
      setMsgServ({ ok: false, texto: msg(e, 'No se pudo guardar el servicio.') });
    } finally {
      setGuardandoServ(false);
    }
  };
  const quitarServicio = async (s: ServicioApi) => {
    if (!window.confirm(`¿Desactivar «${s.titulo}»? Dejará de mostrarse y de poder reservarse (las citas pasadas se conservan).`)) return;
    try {
      await desactivarServicio(s.id);
      servicios.reload();
    } catch (e) {
      setMsgServ({ ok: false, texto: msg(e, 'No se pudo desactivar el servicio.') });
    }
  };

  const cerrarSesion = () => {
    logout();
    setScreen('onboarding');
  };

  if (perfil.loading && !perfil.data) {
    return <div className="flex justify-center py-16" aria-busy="true"><Loader2 className="w-7 h-7 text-primary-500 animate-spin" aria-label="Cargando perfil" /></div>;
  }
  if (perfil.error || !perfil.data) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-slatey-100 bg-white p-8 text-center">
        <AlertCircle className="w-7 h-7 text-accent-600" />
        <p className="text-sm text-slatey-600">{perfil.error ?? 'No se pudo cargar tu perfil.'}</p>
        <Button size="sm" onClick={perfil.reload}>Reintentar</Button>
      </div>
    );
  }

  const mp = perfil.data;
  const verif = VERIF[mp.estadoVerificacion];
  const Mensaje = ({ m }: { m: { ok: boolean; texto: string } | null }) =>
    m ? <p role={m.ok ? 'status' : 'alert'} className={`text-xs font-medium ${m.ok ? 'text-success-600' : 'text-error-600'}`}>{m.texto}</p> : null;

  return (
    <div className="space-y-5">
      {/* Foto de perfil */}
      <div className="bg-white rounded-2xl p-5 border border-slatey-100">
        <div className="flex items-center gap-4">
          <div className="relative">
            <SmartImage src={user.photoUrl} alt={user.fullName || 'Foto de perfil'} ratio="1/1" fallback="avatar" gravity="face" widths={[160, 320]} sizes="80px" className="w-20 h-20 rounded-2xl" />
            <input ref={perfilInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={cambiarFotoPerfil} />
            <button onClick={() => perfilInput.current?.click()} aria-label="Cambiar foto de perfil" className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slatey-900 truncate">{user.fullName}</h3>
            <p className="text-xs text-slatey-500 mt-0.5">COP {mp.perfil.numeroColegiatura}</p>
            <Badge variant={verif.variant} size="sm" className="mt-2">{verif.label}</Badge>
          </div>
        </div>
        {fotoError && <p role="alert" className="mt-3 text-xs font-medium text-error-600">{fotoError}</p>}
      </div>

      {/* Información profesional y consultorio */}
      <Seccion icono={<User className="w-4 h-4" />} titulo="Información profesional">
        <Input label="Nombre completo" value={nombre} onChange={setNombre} icon={<User className="w-5 h-5" />} />
        <Input label="Teléfono" value={telefono} onChange={setTelefono} type="tel" icon={<Phone className="w-5 h-5" />} />
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slatey-50 text-sm text-slatey-700 min-w-0">
          <Mail className="w-4 h-4 text-slatey-400 flex-shrink-0" /> <span className="truncate">{user.email}</span>
          <span className="ml-auto text-[10px] text-slatey-400 flex-shrink-0">No editable</span>
        </div>
        <div>
          <p className="block text-sm font-semibold text-slatey-700 mb-1.5">Especialidades</p>
          <div className="flex flex-wrap gap-2">
            {(catalogos.data?.especialidades ?? []).map((e) => {
              const activa = especialidadIds.includes(Number(e.id));
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => setEspecialidadIds((p) => (activa ? p.filter((x) => x !== Number(e.id)) : [...p, Number(e.id)]))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activa ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-slatey-600 border-slatey-200 hover:border-primary-300'}`}
                >
                  <Stethoscope className="w-3 h-3 inline mr-1" />{e.nombre}
                </button>
              );
            })}
            {catalogos.loading && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}
          </div>
        </div>
        <Input label="Nombre del consultorio" value={consultorio} onChange={setConsultorio} icon={<Building2 className="w-5 h-5" />} maxLength={150} />
        <Input label="Dirección" value={direccion} onChange={setDireccion} icon={<MapPin className="w-5 h-5" />} maxLength={255} />
        <div>
          <label htmlFor="distrito" className="block text-sm font-semibold text-slatey-700 mb-1.5">Distrito</label>
          <select id="distrito" value={distrito} onChange={(e) => setDistrito(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-sm text-slatey-900 focus:border-primary-400 focus:outline-none">
            <option value="">Selecciona un distrito</option>
            {distrito && !(catalogos.data?.distritos ?? []).includes(distrito) && <option value={distrito}>{distrito}</option>}
            {(catalogos.data?.distritos ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slatey-50">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slatey-700">Ubicación en el mapa</p>
            <p className="text-[11px] text-slatey-500">{coords ? `${coords.lat}, ${coords.lng}` : 'Sin ubicación: no apareces en «cerca de mí».'}</p>
          </div>
          <Button size="sm" variant="outline" onClick={usarMiUbicacion}><MapPin className="w-3.5 h-3.5" /> Usar la actual</Button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Input label="RUC (11 dígitos)" value={ruc} onChange={(v) => setRuc(v.replace(/\D/g, '').slice(0, 11))} icon={<CreditCard className="w-5 h-5" />} maxLength={11} />
          <Input label="CCI para abonos (20 dígitos)" value={cci} onChange={(v) => setCci(v.replace(/\D/g, '').slice(0, 20))} icon={<CreditCard className="w-5 h-5" />} maxLength={20} />
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slatey-50">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slatey-700">Confirmar reservas manualmente</p>
            <p className="text-[11px] text-slatey-500">Si lo activas, cada reserva pagada espera tu confirmación.</p>
          </div>
          <Toggle checked={confirmacionManual} onChange={setConfirmacionManual} />
        </div>
        <Mensaje m={msgPerfil} />
        <Button fullWidth size="lg" loading={guardandoPerfil} onClick={guardarPerfil}><Check className="w-5 h-5" /> Guardar cambios</Button>
      </Seccion>

      {/* Verificación */}
      <Seccion icono={<Shield className="w-4 h-4" />} titulo="Verificación profesional (COP)" derecha={<Badge variant={verif.variant} size="sm">{verif.label}</Badge>}>
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${mp.estadoVerificacion === 'VERIFICADO' ? 'bg-success-50 border-success-100' : mp.estadoVerificacion === 'PENDIENTE' ? 'bg-warning-50 border-warning-100' : 'bg-error-50 border-error-100'}`}>
          {mp.estadoVerificacion === 'VERIFICADO' ? <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0" />}
          <div className="text-xs text-slatey-700 space-y-1">
            <p>{verif.texto}</p>
            {mp.notaObservacion && <p className="font-semibold">Nota: {mp.notaObservacion}</p>}
          </div>
        </div>
        {mp.estadoVerificacion === 'PENDIENTE' && <Button size="sm" variant="outline" onClick={reintentar}>Reintentar verificación ahora</Button>}
        {mp.estadoVerificacion !== 'VERIFICADO' && (
          <div className="grid grid-cols-2 gap-3">
            {DOCS.map((d) => {
              const yaSubido = (docs.data ?? []).some((x) => x.tipo === d.tipo);
              return <DocUpload key={d.tipo} label={d.label} subido={yaSubido} cargando={subiendoDoc === d.tipo} onFile={(f) => subirDoc(d.tipo, f)} />;
            })}
          </div>
        )}
        <Mensaje m={msgVerif} />
      </Seccion>

      {/* Servicios */}
      <Seccion icono={<FileText className="w-4 h-4" />} titulo="Mis servicios" derecha={editando ? undefined : <Button size="sm" onClick={() => abrirServicio('nuevo')}><Plus className="w-3.5 h-3.5" /> Nuevo</Button>}>
        {servicios.loading && <Loader2 className="w-5 h-5 text-primary-500 animate-spin mx-auto" aria-label="Cargando servicios" />}
        {servicios.error && <p role="alert" className="text-xs text-error-600">{servicios.error}</p>}
        {!servicios.loading && !servicios.error && (servicios.data ?? []).length === 0 && !editando && (
          <p className="text-xs text-slatey-500 text-center py-2">Aún no tienes servicios. Agrega al menos uno para que los pacientes puedan reservar.</p>
        )}
        {!editando && (servicios.data ?? []).map((s) => (
          <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${s.activo ? 'border-slatey-100 bg-white' : 'border-slatey-100 bg-slatey-50 opacity-60'}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slatey-900 truncate">{s.titulo}</p>
              <p className="text-[11px] text-slatey-500">{s.categoria} · {s.duracionMinutos} min · {soles(s.precioTotal)} · depósito {soles(s.montoDeposito)}{!s.activo ? ' · inactivo' : ''}</p>
            </div>
            <button onClick={() => abrirServicio(s)} aria-label={`Editar ${s.titulo}`} className="p-2 rounded-lg hover:bg-slatey-100"><Pencil className="w-4 h-4 text-slatey-500" /></button>
            {s.activo && <button onClick={() => quitarServicio(s)} aria-label={`Desactivar ${s.titulo}`} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>}
          </div>
        ))}
        {editando && (
          <div className="space-y-3">
            <Input label="Título" value={sTitulo} onChange={setSTitulo} maxLength={150} />
            <div>
              <label htmlFor="categoria" className="block text-sm font-semibold text-slatey-700 mb-1.5">Categoría</label>
              <select id="categoria" value={sCategoria} onChange={(e) => setSCategoria(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-sm focus:border-primary-400 focus:outline-none">
                <option value="">Selecciona una categoría</option>
                {(catalogos.data?.categorias ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Precio (S/)" value={sPrecio} onChange={(v) => setSPrecio(v.replace(/[^\d.,]/g, ''))} />
              <Input label="Duración (min)" value={sDuracion} onChange={(v) => setSDuracion(v.replace(/\D/g, '').slice(0, 3))} />
            </div>
            <textarea value={sDesc} onChange={(e) => setSDesc(e.target.value.slice(0, 2000))} rows={3} placeholder="Descripción (opcional)" aria-label="Descripción del servicio" className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-sm focus:border-primary-400 focus:outline-none resize-none" />
            <p className="text-[11px] text-slatey-500">El depósito (20 % del precio) lo calcula el sistema. Las citas ya reservadas conservan el precio con el que se reservaron.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setEditando(null)} disabled={guardandoServ}>Cancelar</Button>
              <Button loading={guardandoServ} onClick={guardarServicio}>Guardar</Button>
            </div>
          </div>
        )}
        <Mensaje m={msgServ} />
      </Seccion>

      {/* Galería */}
      <Seccion icono={<Camera className="w-4 h-4" />} titulo="Galería del consultorio" derecha={<Badge variant="neutral" size="sm">{listaFotos.length} fotos</Badge>}>
        <div className="grid grid-cols-3 gap-2">
          {listaFotos.map((f, i) => (
            <div key={f.id} className="relative rounded-xl overflow-hidden border border-slatey-200 group">
              <SmartImage src={f.url} alt={`Consultorio ${i + 1}`} ratio="1/1" fallback="clinic" widths={[160, 320]} sizes="33vw" />
              <button onClick={() => quitarFoto(f.id)} aria-label={`Eliminar foto ${i + 1}`} className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-error-500 text-white flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <input ref={galeriaInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={agregarFoto} />
          <button onClick={() => galeriaInput.current?.click()} disabled={subiendo || listaFotos.length >= 10} className="aspect-square rounded-xl border-2 border-dashed border-slatey-200 flex flex-col items-center justify-center text-slatey-400 hover:border-primary-300 hover:text-primary-500 transition-colors disabled:opacity-50">
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium mt-1">{subiendo ? 'Subiendo…' : 'Agregar'}</span>
          </button>
        </div>
        {fotos.error && <p role="alert" className="text-xs text-error-600">{fotos.error}</p>}
      </Seccion>

      {/* Horarios */}
      <Seccion icono={<Clock className="w-4 h-4" />} titulo="Horarios de atención">
        {horarios.loading && !horarios.data && <Loader2 className="w-5 h-5 text-primary-500 animate-spin mx-auto" aria-label="Cargando horarios" />}
        {horarios.error && <p role="alert" className="text-xs text-error-600">{horarios.error}</p>}
        <div className="space-y-2">
          {DIAS_SEMANA.map((d) => {
            const tramos = semana[d.api];
            const activo = tramos.length > 0;
            return (
              <div key={d.api} className={`p-3 rounded-xl border transition-all ${activo ? 'border-primary-200 bg-primary-50/30' : 'border-slatey-100 bg-slatey-50'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleDia(d.api)} aria-label={`${activo ? 'Desactivar' : 'Activar'} ${d.label}`} aria-pressed={activo} className={`w-10 h-6 rounded-full flex items-center transition-colors flex-shrink-0 ${activo ? 'bg-primary-500' : 'bg-slatey-300'}`}>
                    <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`w-5 h-5 rounded-full bg-white shadow-md ${activo ? 'ml-auto mr-0.5' : 'ml-0.5'}`} />
                  </button>
                  <span className={`text-sm font-semibold flex-1 ${activo ? 'text-slatey-900' : 'text-slatey-400'}`}>{d.label}</span>
                  {!activo && <span className="text-xs text-slatey-400">No disponible</span>}
                  {activo && <button onClick={() => agregarTramo(d.api)} className="text-xs font-semibold text-primary-600 hover:underline">+ Tramo</button>}
                </div>
                {tramos.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2 pl-[52px]">
                    <input type="time" aria-label={`${d.label} inicio`} value={t.start} onChange={(e) => cambiarTramo(d.api, i, 'start', e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-slatey-200 bg-white text-xs font-semibold text-slatey-700 focus:border-primary-400 focus:outline-none" />
                    <span className="text-xs text-slatey-400">—</span>
                    <input type="time" aria-label={`${d.label} fin`} value={t.end} onChange={(e) => cambiarTramo(d.api, i, 'end', e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-slatey-200 bg-white text-xs font-semibold text-slatey-700 focus:border-primary-400 focus:outline-none" />
                    {tramos.length > 1 && <button onClick={() => quitarTramo(d.api, i)} aria-label="Quitar tramo" className="p-1 rounded hover:bg-error-50"><X className="w-3.5 h-3.5 text-error-500" /></button>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slatey-500">Si desactivas un día, no se cancelan las citas ya reservadas: usa «Bloquear agenda» para cerrar fechas concretas.</p>
        <Mensaje m={msgHorario} />
        <Button fullWidth loading={guardandoHorario} onClick={guardarSemana}><Check className="w-4 h-4" /> Guardar horario</Button>
      </Seccion>

      {/* Bloqueos */}
      <Seccion icono={<CalendarOff className="w-4 h-4" />} titulo="Bloquear agenda (vacaciones, congresos)">
        {bloqueos.loading && !bloqueos.data && <Loader2 className="w-5 h-5 text-primary-500 animate-spin mx-auto" aria-label="Cargando bloqueos" />}
        {(bloqueos.data ?? []).map((b) => (
          <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slatey-50 border border-slatey-100">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slatey-900">{diaLima(b.inicio)} {horaLima(b.inicio)} → {diaLima(b.fin)} {horaLima(b.fin)}</p>
              {b.motivo && <p className="text-[11px] text-slatey-500 truncate">{b.motivo}</p>}
            </div>
            <button onClick={() => quitarBloqueo(b.id)} aria-label="Quitar bloqueo" className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
          </div>
        ))}
        {!bloqueos.loading && !bloqueos.error && (bloqueos.data ?? []).length === 0 && <p className="text-xs text-slatey-500">No tienes bloqueos vigentes.</p>}
        <div className="grid grid-cols-1 gap-3">
          <label className="block"><span className="block text-xs font-semibold text-slatey-700 mb-1">Desde</span>
            <input type="datetime-local" value={bIni} onChange={(e) => setBIni(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-slatey-200 bg-slatey-50 text-sm focus:border-primary-400 focus:outline-none" /></label>
          <label className="block"><span className="block text-xs font-semibold text-slatey-700 mb-1">Hasta</span>
            <input type="datetime-local" value={bFin} onChange={(e) => setBFin(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-slatey-200 bg-slatey-50 text-sm focus:border-primary-400 focus:outline-none" /></label>
          <Input label="Motivo (opcional)" value={bMotivo} onChange={setBMotivo} maxLength={150} />
        </div>
        <Mensaje m={msgBloqueo} />
        <Button fullWidth variant="outline" loading={guardandoBloqueo} onClick={crearBloqueoClick}><CalendarOff className="w-4 h-4" /> Bloquear estas fechas</Button>
        <p className="text-[11px] text-slatey-500">Máximo 60 días. Las citas ya reservadas en ese rango se cancelan con reembolso del 100 %.</p>
      </Seccion>

      <button onClick={cerrarSesion} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-error-50 border-2 border-error-100 text-error-600 font-bold text-sm hover:bg-error-100 transition-colors mb-4">
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>
    </div>
  );
}

function DocUpload({ label, subido, cargando, onFile }: { label: string; subido: boolean; cargando: boolean; onFile: (f: File) => void }) {
  const id = `upload-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl border-2 border-dashed border-slatey-200 hover:border-primary-300 transition-colors">
      <div className="flex items-center gap-2 text-xs font-semibold text-slatey-700"><BadgeCheck className="w-4 h-4 text-primary-500" />{label}</div>
      <input type="file" id={id} accept="application/pdf,image/jpeg,image/png" className="sr-only" disabled={cargando} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); }} />
      <label htmlFor={id} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slatey-50 text-xs text-slatey-600 hover:bg-slatey-100 cursor-pointer transition-colors">
        {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {cargando ? 'Subiendo…' : subido ? 'Reemplazar' : 'Seleccionar'}
      </label>
      {subido && <p className="text-[10px] text-success-600 flex items-center gap-1"><Check className="w-3 h-3" /> Ya enviado</p>}
    </div>
  );
}
