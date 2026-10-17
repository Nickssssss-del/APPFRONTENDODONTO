import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, MapPin, BadgeCheck, AlertCircle, ArrowRight, Calendar, Check, Search, Loader2, RefreshCw,
} from 'lucide-react';
import { useApp, formatTime } from '@/storeHooks';
import { DAY_LABELS } from '@/constants';
import { Button, Badge } from '../components/ui';
import { useAsync } from '@/hooks/useAsync';
import { buscarOdontologos, obtenerDisponibilidad, obtenerOdontologo, type ServicioApi } from '@/api/catalog';

/* ───────── utilidades de fecha (zona horaria de Lima, UTC-5, sin horario de verano) ───────── */
type Dia = { iso: string; label: string; num: number; texto: string };

/** Los próximos `n` días a partir de HOY en Lima: [{ iso: '2026-10-20', label: 'Mar', num: 20, texto: 'Mar 20' }, …]. */
function proximosDias(n = 14): Dia[] {
  const lima = new Date(Date.now() - 5 * 3600_000);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate() + i));
    const label = DAY_LABELS[(d.getUTCDay() + 6) % 7]; // getUTCDay(): 0 = domingo
    const num = d.getUTCDate();
    return { iso: d.toISOString().slice(0, 10), label, num, texto: `${label} ${num}` };
  });
}

/** El turno llega con la zona del consultorio (2026-10-20T09:00:00-05:00): se muestra la hora tal cual viene. */
const horaDeTurno = (inicio: string) => inicio.slice(11, 16);

function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Avatar({ nombre, url, className }: { nombre: string; url?: string | null; className: string }) {
  const [fallo, setFallo] = useState(false);
  if (url && !fallo) {
    return <img src={url} alt={nombre} onError={() => setFallo(true)} className={`${className} object-cover`} />;
  }
  const iniciales = nombre.replace(/^(Dr\.|Dra\.)\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <div className={`${className} bg-primary-100 text-primary-700 font-bold flex items-center justify-center`}>{iniciales || '🦷'}</div>
  );
}

const servicioToTreatment = (s: ServicioApi) => ({
  id: s.id,
  name: s.titulo,
  price: Number(s.precioTotal),
  description: s.descripcion ?? s.categoria,
  duration: s.duracionMinutos,
  deposit: Number(s.montoDeposito),
});

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export default function Marketplace() {
  const {
    role, isAuth, setScreen, selectedTreatment, setSelectedTreatment, isHoldActive, holdSeconds,
    selectedDentistId, setSelectedDentistId, setSelectedDentistName,
    selectedDay, setSelectedDay, selectedTime, setSelectedTime, setSelectedSlotStart, selectedSlotStart,
  } = useApp();

  /* ═════════ LISTA: odontólogos reales ═════════ */
  const [busqueda, setBusqueda] = useState('');
  const q = useDebounced(busqueda.trim());
  const lista = useAsync((signal) => buscarOdontologos({ q: q || undefined, tamano: 20 }, signal), [q]);

  /* ═════════ DETALLE: perfil, servicios y turnos reales ═════════ */
  const dias = useMemo(() => proximosDias(14), []);
  const [fechaIso, setFechaIso] = useState(dias[0].iso);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const perfil = useAsync(
    (signal) => (selectedDentistId ? obtenerOdontologo(selectedDentistId, signal) : Promise.resolve(null)),
    [selectedDentistId],
  );
  const servicios = useMemo(() => (perfil.data?.servicios ?? []).filter((s) => s.activo), [perfil.data]);
  const servicio = servicios.find((s) => s.id === servicioId) ?? null;

  // Al cargar el perfil, deja seleccionado el primer servicio (y lo publica en el store para confirmación y pago).
  useEffect(() => {
    if (!servicios.length) return;
    if (!servicios.some((s) => s.id === servicioId)) {
      setServicioId(servicios[0].id);
      setSelectedTreatment(servicioToTreatment(servicios[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicios]);

  const disponibilidad = useAsync(
    (signal) => (selectedDentistId && servicioId ? obtenerDisponibilidad(selectedDentistId, servicioId, fechaIso, signal) : Promise.resolve(null)),
    [selectedDentistId, servicioId, fechaIso],
  );
  const turnos = disponibilidad.data?.turnos ?? [];

  const handleSelectDentist = (id: string, nombre: string) => {
    setSelectedDentistId(id);
    setSelectedDentistName(nombre);
    setServicioId(null);
    setFechaIso(dias[0].iso);
    setSelectedDay(dias[0].texto);
    setSelectedTime(null);
    setSelectedSlotStart(null);
    setGalleryIdx(0);
  };

  const handleSelectServicio = (s: ServicioApi) => {
    setServicioId(s.id);
    setSelectedTreatment(servicioToTreatment(s));
    setSelectedTime(null);
    setSelectedSlotStart(null);
  };

  const handleDaySelect = (d: Dia) => {
    setFechaIso(d.iso);
    setSelectedDay(d.texto);
    setSelectedTime(null);
    setSelectedSlotStart(null);
  };

  const handleReserveClick = () => {
    if (!selectedSlotStart || !servicio) return;
    setScreen(isAuth ? 'confirmarCita' : 'onboarding');
  };

  /* ═════════ VISTA 1: lista de dentistas ═════════ */
  if (!selectedDentistId) {
    const items = lista.data?.contenido ?? [];
    return (
      <div className="min-h-screen bg-slatey-50 pb-24">
        <div className="sticky top-0 z-30 glass border-b border-slatey-100">
          <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen(role === 'patient' ? 'patientDashboard' : 'dentistPanel')}
                className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors"
              >
                <BackIcon />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slatey-900 font-display">Dentistas disponibles</h2>
                <p className="text-xs text-slatey-500">Elige un odontólogo para reservar</p>
              </div>
            </div>
            {lista.data && <Badge variant="primary" size="sm">{lista.data.totalElementos} disponibles</Badge>}
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slatey-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, consultorio o especialidad"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slatey-200 bg-white text-sm text-slatey-900 placeholder:text-slatey-400 focus:outline-none focus:border-primary-400"
            />
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-5 space-y-3">
          {lista.loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-slatey-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando odontólogos…
            </div>
          )}

          {lista.error && (
            <div className="p-4 rounded-2xl bg-error-50 border border-error-200 text-center">
              <p className="text-sm text-error-700 mb-3">{lista.error}</p>
              <Button size="sm" onClick={lista.reload}><RefreshCw className="w-4 h-4" /> Reintentar</Button>
            </div>
          )}

          {!lista.loading && !lista.error && items.length === 0 && (
            <p className="text-center text-sm text-slatey-500 py-10">No encontramos odontólogos con esa búsqueda.</p>
          )}

          {items.map((d, i) => (
            <motion.button
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.05 }}
              onClick={() => handleSelectDentist(d.id, d.nombre)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-slatey-100 hover:border-primary-200 hover:shadow-md transition-all text-left"
            >
              <Avatar nombre={d.nombre} url={d.fotoUrl} className="w-16 h-16 rounded-2xl border-2 border-slatey-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slatey-900 font-display">{d.nombre}</h3>
                <p className="text-xs text-slatey-500 mt-0.5 truncate">{d.especialidades.join(' · ') || 'Odontología General'}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {d.calificacion != null && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-accent-400 text-accent-400" />
                      <span className="text-xs font-bold text-slatey-900">{Number(d.calificacion).toFixed(1)}</span>
                      <span className="text-xs text-slatey-400">({d.totalResenas ?? 0})</span>
                    </div>
                  )}
                  {(d.distrito || d.consultorio) && (
                    <>
                      {d.calificacion != null && <span className="text-xs text-slatey-300">·</span>}
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3 h-3 text-slatey-400 flex-shrink-0" />
                        <span className="text-xs text-slatey-500 truncate">{d.distrito ?? d.consultorio}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {d.precioDesde != null && <span className="text-sm font-bold text-primary-600">Desde S/ {Number(d.precioDesde).toFixed(0)}</span>}
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-500 text-white">
                  Reservar <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  /* ═════════ VISTA 2: detalle + reserva ═════════ */
  const volverALista = () => {
    setSelectedDentistId(null);
    setSelectedDentistName('');
    setSelectedTime(null);
    setSelectedSlotStart(null);
  };

  if (perfil.loading || perfil.error || !perfil.data) {
    return (
      <div className="min-h-screen bg-slatey-50 flex flex-col items-center justify-center px-6 text-center gap-4">
        {perfil.error ? (
          <>
            <AlertCircle className="w-8 h-8 text-error-500" />
            <p className="text-sm text-slatey-700">{perfil.error}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={perfil.reload}><RefreshCw className="w-4 h-4" /> Reintentar</Button>
              <Button size="sm" variant="outline" onClick={volverALista}>Volver</Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slatey-500 text-sm"><Loader2 className="w-5 h-5 animate-spin" /> Cargando perfil…</div>
        )}
      </div>
    );
  }

  const p = perfil.data;
  const fotos = p.fotos;
  const especialidades = p.especialidades.map((e) => e.nombre).join(' · ') || 'Odontología General';
  const deposito = servicio ? Number(servicio.montoDeposito) : 0;
  const esDentista = role === 'dentist';
  const mapsUrl = p.latitud != null && p.longitud != null
    ? `https://www.google.com/maps/search/?api=1&query=${p.latitud},${p.longitud}`
    : p.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.direccion}, ${p.distrito ?? ''}`)}` : null;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-slatey-50 pb-24">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {/* Portada */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700">
          {fotos[0] && <img src={fotos[0].url} alt="Consultorio" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slatey-900/70 via-slatey-900/20 to-transparent" />
          <button onClick={volverALista} className="absolute top-4 left-4 p-2.5 rounded-xl glass text-white hover:bg-white/20 transition-colors">
            <BackIcon />
          </button>
        </div>

        {/* Info del odontólogo */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-white rounded-3xl shadow-lg shadow-slatey-900/5 p-5">
            <div className="flex items-start gap-4">
              <Avatar nombre={p.nombre} url={p.fotoUrl} className="w-16 h-16 rounded-2xl border-2 border-white shadow-md -mt-8 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slatey-900 font-display">{p.nombre}</h2>
                <p className="text-sm text-slatey-500">{especialidades}</p>
                {(p.consultorio || p.direccion) && (
                  <p className="text-xs text-slatey-600 mt-1.5">
                    {[p.consultorio, p.direccion, p.distrito].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {p.colegiaturaVerificada ? (
                    <Badge variant="success" size="sm"><BadgeCheck className="w-3.5 h-3.5" /> COP {p.numeroColegiatura} Verificado</Badge>
                  ) : (
                    <Badge variant="primary" size="sm">COP {p.numeroColegiatura} · en verificación</Badge>
                  )}
                  {p.calificacion != null && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-accent-400 text-accent-400" />
                      <span className="text-sm font-bold text-slatey-900">{Number(p.calificacion).toFixed(1)}</span>
                      <span className="text-xs text-slatey-400">({p.totalResenas ?? 0} reseñas)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {mapsUrl && (
              <button
                onClick={() => window.open(mapsUrl, '_blank', 'noopener')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-50 text-primary-600 text-sm font-semibold hover:bg-primary-100 transition-colors"
              >
                <MapPin className="w-4 h-4" /> Ver en Maps
              </button>
            )}
          </div>
        </div>

        {/* Galería */}
        {fotos.length > 0 && (
          <div className="px-4 mt-6">
            <h3 className="text-sm font-bold text-slatey-900 mb-3 px-1">Galería del establecimiento</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {fotos.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setGalleryIdx(i)}
                  className="flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: galleryIdx === i ? '#0D9488' : 'transparent' }}
                >
                  <img src={f.url} alt={f.descripcion ?? `Foto ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Servicios */}
        <div className="px-4 mt-6 pb-4">
          <h3 className="text-sm font-bold text-slatey-900 mb-3 px-1">Selecciona el tratamiento</h3>
          {servicios.length === 0 ? (
            <p className="text-sm text-slatey-500 px-1">Este odontólogo aún no publicó servicios.</p>
          ) : (
            <div className="space-y-3">
              {servicios.map((s) => {
                const selected = servicioId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectServicio(s)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${selected ? 'border-primary-400 bg-primary-50/50' : 'border-slatey-200 bg-white hover:border-slatey-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-primary-500 bg-primary-500' : 'border-slatey-300'}`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slatey-900">{s.titulo}</span>
                        <span className="font-bold text-primary-600 text-sm flex-shrink-0">S/ {Number(s.precioTotal).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slatey-500 mt-0.5">{s.descripcion || s.categoria} · {s.duracionMinutos} min</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hoja de reserva */}
      <div className="shrink-0 flex flex-col max-h-[42vh] bg-white rounded-t-3xl shadow-2xl shadow-slatey-900/10 border-t border-slatey-100 overflow-hidden">
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-slatey-200" aria-hidden="true" />
        </div>

        <div className="px-5 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slatey-400" />
            <span className="text-xs font-semibold text-slatey-500 uppercase tracking-wide">Selecciona día y hora</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {dias.map((d) => {
              const isSelected = fechaIso === d.iso;
              return (
                <button
                  key={d.iso}
                  onClick={() => handleDaySelect(d)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${isSelected ? 'border-primary-400 bg-primary-500 text-white' : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'}`}
                >
                  {d.texto}
                </button>
              );
            })}
          </div>

          {!servicio ? (
            <p className="mt-3 text-center text-sm text-slatey-500 py-4">Elige un tratamiento para ver los horarios.</p>
          ) : disponibilidad.loading ? (
            <div className="mt-3 flex items-center justify-center gap-2 py-4 text-sm text-slatey-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando horarios…
            </div>
          ) : disponibilidad.error ? (
            <div className="mt-3 text-center py-3">
              <p className="text-sm text-error-600 mb-2">{disponibilidad.error}</p>
              <Button size="sm" onClick={disponibilidad.reload}><RefreshCw className="w-4 h-4" /> Reintentar</Button>
            </div>
          ) : turnos.length === 0 ? (
            <div className="mt-3 flex items-center gap-3 p-4 rounded-xl bg-accent-50 border border-accent-200">
              <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0" />
              <p className="text-sm text-accent-700">No hay horarios disponibles este día. Prueba con otra fecha.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {turnos.map((t) => {
                const hora = horaDeTurno(t.inicio);
                const selected = selectedSlotStart === t.inicio;
                return (
                  <button
                    key={t.inicio}
                    onClick={() => { setSelectedTime(hora); setSelectedSlotStart(t.inicio); }}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${selected ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slatey-200 bg-white text-slatey-600 hover:border-slatey-300'}`}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          )}

          {isHoldActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent-50 border border-accent-200"
            >
              <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-accent-700">Horario bloqueado por {formatTime(holdSeconds)} min</span>
            </motion.div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-slatey-100 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slatey-500">Depósito de reserva</p>
              <p className="text-lg font-bold text-slatey-900">S/ {deposito.toFixed(2)}</p>
            </div>
            <Button size="lg" disabled={!selectedSlotStart || !servicio || esDentista} onClick={handleReserveClick} className="flex-1">
              {esDentista ? 'Solo pacientes' : isAuth ? 'Reservar Cita' : 'Inicia sesión para reservar'}
              {!esDentista && <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-xs text-slatey-400 text-center mt-2">
            {selectedTime ? `${selectedDay} · ${selectedTime} · ${selectedTreatment.name}` : 'Reservas con el depósito indicado.'}
          </p>
        </div>
      </div>
    </div>
  );
}
