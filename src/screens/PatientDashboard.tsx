import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, MapPin, Star, Lock, FileText, AlertCircle, MessageCircle, Settings, Calendar, Upload, ArrowRight,
  CheckCircle2, Navigation, Loader2, Stethoscope,
} from 'lucide-react';
import { useApp } from '../storeHooks';
import { Button, Badge, Modal } from '../components/ui';
import SmartImage from '../components/SmartImage';
import { useAsync } from '../hooks/useAsync';
import { ApiError } from '../api/http';
import { buscarOdontologos } from '../api/catalog';
import { apelarInasistencia, miReputacion } from '../api/panel';
import { diaLima, fechaIsoLima, horaLima, soles, ETIQUETA_ESTADO } from '../lib/format';
import type { CitaApi } from '../api/citas';

const PLAZO_APELACION_MS = 7 * 24 * 60 * 60 * 1000;

export default function PatientDashboard() {
  const { setScreen, setSettingsOpen, user, setSelectedDentistId, citas, refreshAppointments } = useApp();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [ubicacionPedida, setUbicacionPedida] = useState(false);

  // Ubicación solo para ordenar por cercanía; si el paciente no la da, se listan los mejor calificados.
  useEffect(() => {
    if (!navigator.geolocation) {
      setUbicacionPedida(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setUbicacionPedida(true); },
      () => setUbicacionPedida(true),
      { timeout: 8000 },
    );
  }, []);

  const cercanos = useAsync(
    (signal) => (ubicacionPedida ? buscarOdontologos({ lat: coords?.lat, lng: coords?.lng, tamano: 5 }, signal) : Promise.resolve(null)),
    [ubicacionPedida, coords?.lat, coords?.lng],
  );
  const reputacion = useAsync((signal) => miReputacion(signal), []);

  // Próxima cita real: la más cercana en el futuro que no esté cancelada.
  const proxima: CitaApi | undefined = useMemo(
    () =>
      citas
        .filter((c) => ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'REPROGRAMADA'].includes(c.estado) && new Date(c.fin).getTime() > Date.now())
        .sort((a, b) => a.inicio.localeCompare(b.inicio))[0],
    [citas],
  );
  const esHoy = proxima ? fechaIsoLima(proxima.inicio) === fechaIsoLima(new Date()) : false;

  // Apelaciones: solo citas con inasistencia penalizada de los últimos 7 días.
  const apelables = useMemo(
    () => citas.filter((c) => c.estado === 'INASISTENCIA_PENALIZADA' && Date.now() - new Date(c.fin).getTime() <= PLAZO_APELACION_MS),
    [citas],
  );
  const [apelando, setApelando] = useState(false);
  const [citaApelada, setCitaApelada] = useState<string>('');
  const [certificado, setCertificado] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorApelacion, setErrorApelacion] = useState<string | null>(null);
  const [apelacionEnviada, setApelacionEnviada] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const abrirApelacion = () => {
    setCitaApelada(apelables[0]?.id ?? '');
    setCertificado(null);
    setErrorApelacion(null);
    setApelacionEnviada(false);
    setApelando(true);
  };

  const enviarApelacion = async () => {
    if (!citaApelada || !certificado || enviando) return;
    if (certificado.size > 5 * 1024 * 1024) return setErrorApelacion('El certificado supera los 5 MB.');
    setEnviando(true);
    setErrorApelacion(null);
    try {
      await apelarInasistencia(citaApelada, certificado);
      setApelacionEnviada(true);
      void refreshAppointments();
      reputacion.reload();
    } catch (e) {
      setErrorApelacion(e instanceof ApiError ? e.message : 'No se pudo enviar la apelación.');
    } finally {
      setEnviando(false);
    }
  };

  const strikes = reputacion.data?.strikes ?? 0;
  const limite = reputacion.data?.limiteStrikes ?? 3;
  const estadoRep = reputacion.data?.estado;
  const lista = cercanos.data?.contenido ?? [];

  return (
    <div className="min-h-screen bg-slatey-50 pb-24">
      <div className="sticky top-0 z-30 glass border-b border-slatey-100 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <div className="min-w-0">
            <p className="text-xs text-slatey-500">Hola,</p>
            <h2 className="text-lg font-bold text-slatey-900 font-display truncate">{user.fullName || 'Paciente'}</h2>
          </div>
          <button onClick={() => setSettingsOpen(true)} aria-label="Ajustes" className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors">
            <Settings className="w-5 h-5 text-primary-600" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Próxima cita */}
        {proxima ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-5 text-white shadow-lg shadow-primary-500/20">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-100" />
                <span className="text-xs font-semibold text-primary-100 uppercase tracking-wide">{esHoy ? 'Cita hoy' : 'Próxima cita'}</span>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 shrink-0">
                {proxima.estado === 'CONFIRMADA' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Clock className="w-3.5 h-3.5 mr-1" />}
                {ETIQUETA_ESTADO[proxima.estado]}
              </Badge>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-extrabold font-display">{horaLima(proxima.inicio)}</span>
                <span className="text-sm text-primary-100">· {diaLima(proxima.inicio)}</span>
              </div>
              <p className="text-sm font-semibold text-primary-50">{proxima.odontologo.nombre}</p>
              <p className="text-xs text-primary-200 mt-0.5">{proxima.servicio.titulo}</p>
              {(proxima.odontologo.direccion || proxima.odontologo.distrito) && (
                <p className="text-xs text-primary-200 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {[proxima.odontologo.direccion, proxima.odontologo.distrito].filter(Boolean).join(', ')}</p>
              )}
            </div>
            {proxima.estado === 'PENDIENTE_CONFIRMACION' && <p className="text-xs text-primary-100 mb-3">El odontólogo debe confirmar tu reserva. Te avisaremos por correo.</p>}
            {proxima.estado === 'PENDIENTE_PAGO' && <p className="text-xs text-primary-100 mb-3">Falta pagar el depósito de {soles(proxima.depositoRequerido)} para asegurar tu turno.</p>}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([proxima.odontologo.consultorio, proxima.odontologo.direccion, proxima.odontologo.distrito, 'Lima'].filter(Boolean).join(' '))}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-xs font-semibold"
              >
                <Navigation className="w-4 h-4 shrink-0" /> Cómo llegar
              </a>
              <button onClick={() => setScreen('misCitas')} className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-xs font-semibold">
                <Calendar className="w-4 h-4 shrink-0" /> Mis citas
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-3xl p-5 border border-slatey-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto"><Calendar className="w-6 h-6 text-primary-500" /></div>
            <div>
              <p className="text-sm font-bold text-slatey-900">No tienes citas próximas</p>
              <p className="text-xs text-slatey-500 mt-1">Busca un odontólogo verificado y reserva con un depósito.</p>
            </div>
            <Button size="sm" onClick={() => { setSelectedDentistId(null); setScreen('marketplace'); }}>Reservar cita <ArrowRight className="w-4 h-4" /></Button>
          </div>
        )}

        {/* Odontólogos (reales) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-slatey-900">{coords ? 'Odontólogos cerca de ti' : 'Odontólogos destacados'}</h3>
            <button onClick={() => { setSelectedDentistId(null); setScreen('marketplace'); }} className="text-xs font-semibold text-primary-600 hover:underline">Ver todos</button>
          </div>
          {(cercanos.loading || !ubicacionPedida) && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary-500 animate-spin" aria-label="Buscando odontólogos" /></div>}
          {cercanos.error && (
            <div role="alert" className="rounded-2xl border border-slatey-100 bg-white p-4 text-center space-y-2">
              <p className="text-xs text-slatey-600">{cercanos.error}</p>
              <Button size="sm" onClick={cercanos.reload}>Reintentar</Button>
            </div>
          )}
          {!cercanos.loading && !cercanos.error && ubicacionPedida && lista.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slatey-200 bg-white p-5 text-center">
              <p className="text-xs text-slatey-500">{coords ? 'No hay odontólogos verificados en 10 km a tu alrededor.' : 'Aún no hay odontólogos verificados disponibles.'}</p>
            </div>
          )}
          <div className="space-y-3">
            {lista.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-slatey-100 p-3 flex items-center gap-3">
                <SmartImage src={o.fotoUrl} alt={o.nombre} ratio="1/1" fallback="avatar" gravity="face" widths={[96, 192]} sizes="56px" className="w-14 h-14 rounded-2xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slatey-900 truncate">{o.nombre}</p>
                  <p className="text-xs text-slatey-500 truncate"><Stethoscope className="w-3 h-3 inline mr-1" />{o.especialidades[0] ?? 'Odontología general'}{o.distrito ? ` · ${o.distrito}` : ''}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slatey-500">
                    {Number(o.totalResenas ?? 0) > 0 && <span className="flex items-center gap-0.5 font-bold text-slatey-900"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(o.calificacion ?? 0).toFixed(1)} <span className="font-normal text-slatey-500">({o.totalResenas})</span></span>}
                    {o.distanciaKm != null && <span>{o.distanciaKm.toFixed(1)} km</span>}
                    {o.precioDesde != null && <span>Desde {soles(o.precioDesde)}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setSelectedDentistId(o.id); setScreen('dentistProfile'); }}>Ver</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Reputación (GET /api/usuarios/yo/reputacion) */}
        <div className="bg-white rounded-2xl p-4 border border-slatey-100 flex items-center gap-4 shadow-2xs">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${estadoRep === 'BLOQUEADO' ? 'bg-error-50' : strikes > 0 ? 'bg-accent-50' : 'bg-success-50'}`}>
            <Star className={`w-6 h-6 ${estadoRep === 'BLOQUEADO' ? 'text-error-500' : strikes > 0 ? 'text-accent-600' : 'text-success-500'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slatey-900">Mi estado</p>
            {reputacion.loading ? (
              <p className="text-xs text-slatey-500">Cargando…</p>
            ) : reputacion.error ? (
              <p className="text-xs text-slatey-500">No disponible por ahora</p>
            ) : (
              <>
                <p className="text-xs text-slatey-500"><span className="font-bold text-slatey-900">{strikes}/{limite}</span> inasistencias</p>
                <div className="flex gap-1 mt-1.5">
                  {Array.from({ length: limite }, (_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < strikes ? 'bg-error-400' : 'bg-success-400'}`} />)}
                </div>
              </>
            )}
          </div>
          {reputacion.data && (
            <Badge variant={estadoRep === 'BLOQUEADO' ? 'error' : strikes > 0 ? 'warning' : 'success'} size="sm" className="shrink-0">
              {estadoRep === 'BLOQUEADO' ? 'Bloqueado' : strikes > 0 ? 'Regular' : 'Puntual'}
            </Badge>
          )}
        </div>
        {reputacion.data && !reputacion.data.puedeReservar && (
          <div role="alert" className="flex items-start gap-2 rounded-2xl bg-error-50 border border-error-100 px-3.5 py-3 text-xs font-medium text-error-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>Alcanzaste el límite de inasistencias y no puedes reservar por ahora{reputacion.data.restringidoHasta ? ` (hasta el ${diaLima(reputacion.data.restringidoHasta)})` : ''}. Si fue por un imprevisto médico, puedes apelar.</span>
          </div>
        )}

        {/* Historial clínico */}
        <div className="bg-white rounded-2xl p-4 border border-slatey-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slatey-100 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-slatey-600" /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slatey-900 text-sm truncate">Mi historial clínico</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-primary-500 shrink-0" />
                <span className="text-[11px] text-slatey-500 truncate">Se guarda cifrado</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={() => setScreen('patientProfile')}>Ver <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
          </div>
        </div>

        {/* Apelación: solo si hay una inasistencia apelable */}
        {apelables.length > 0 && (
          <button onClick={abrirApelacion} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left hover:bg-amber-500/15 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5 text-amber-600" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slatey-900 truncate">¿Tuviste un imprevisto médico?</p>
              <p className="text-xs text-slatey-600 truncate">Apela tu inasistencia con un certificado ({apelables.length} apelable{apelables.length === 1 ? '' : 's'})</p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-600 shrink-0" />
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setSelectedDentistId(null); setScreen('marketplace'); }} className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white border border-slatey-100 hover:border-primary-200 transition-all text-left shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary-500" /></div>
            <div><p className="text-sm font-bold text-slatey-900">Nueva cita</p><p className="text-xs text-slatey-500">Reservar consulta</p></div>
          </button>
          <button onClick={() => setScreen('chatbot')} className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white border border-slatey-100 hover:border-primary-200 transition-all text-left shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-primary-500" /></div>
            <div><p className="text-sm font-bold text-slatey-900">OdontoBot</p><p className="text-xs text-slatey-500">Orientación dental</p></div>
          </button>
        </div>
      </div>

      {/* Apelación (POST /api/citas/{id}/apelacion, multipart) */}
      <Modal open={apelando} onClose={() => setApelando(false)} title="Apelar inasistencia">
        {apelacionEnviada ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-4"><CheckCircle2 className="w-9 h-9 text-success-500" /></div>
            <h3 className="text-lg font-bold text-slatey-900 mb-1">Apelación enviada</h3>
            <p className="text-sm text-slatey-500">El odontólogo revisará tu certificado. Si la aprueba, se te quita el strike y se te devuelve el depósito.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slatey-700 leading-relaxed">Adjunta tu certificado o descanso médico. Solo puedes apelar una vez por cita y dentro de los 7 días siguientes.</p>
            </div>
            {apelables.length > 1 && (
              <div>
                <label htmlFor="cita-apelada" className="block text-sm font-semibold text-slatey-700 mb-2">Cita</label>
                <select id="cita-apelada" value={citaApelada} onChange={(e) => setCitaApelada(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-sm focus:border-primary-400 focus:outline-none">
                  {apelables.map((c) => <option key={c.id} value={c.id}>{diaLima(c.inicio)} {horaLima(c.inicio)} · {c.odontologo.nombre}</option>)}
                </select>
              </div>
            )}
            {apelables.length === 1 && <p className="text-xs text-slatey-600">{diaLima(apelables[0].inicio)} · {horaLima(apelables[0].inicio)} · {apelables[0].odontologo.nombre}</p>}
            <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => { setCertificado(e.target.files?.[0] ?? null); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm font-medium">
              <Upload className="w-5 h-5" />
              {certificado ? certificado.name : 'Adjuntar certificado (PDF, JPG o PNG · máx. 5 MB)'}
            </button>
            {errorApelacion && <p role="alert" className="text-xs font-medium text-error-600">{errorApelacion}</p>}
            <Button fullWidth loading={enviando} disabled={!certificado || !citaApelada} onClick={enviarApelacion}>Enviar apelación</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
