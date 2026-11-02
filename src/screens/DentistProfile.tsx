import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Clock, Loader2, MapPin, Star, AlertCircle, Stethoscope } from 'lucide-react';
import { useApp } from '@/storeHooks';
import { Button, Badge } from '@/components/ui';
import SmartImage from '@/components/SmartImage';
import { useAsync } from '@/hooks/useAsync';
import { obtenerOdontologo } from '@/api/catalog';
import { resenasDeOdontologo } from '@/api/panel';
import { diaLima, soles } from '@/lib/format';
import { DIAS_SEMANA } from '@/api/panel';

const hhmm = (t: string) => t.slice(0, 5);

/** Perfil público de un odontólogo: GET /api/odontologos/{id} y /api/odontologos/{id}/resenas. */
export default function DentistProfile() {
  const { setScreen, selectedDentistId, role, isAuth } = useApp();
  const volver = () => setScreen(isAuth && role === 'patient' ? 'patientDashboard' : 'marketplace');

  const perfil = useAsync((signal) => (selectedDentistId ? obtenerOdontologo(selectedDentistId, signal) : Promise.reject(new Error('sin id'))), [selectedDentistId]);
  const resenas = useAsync((signal) => (selectedDentistId ? resenasDeOdontologo(selectedDentistId, 0, signal) : Promise.resolve(null)), [selectedDentistId]);
  const d = perfil.data;

  return (
    <div className="min-h-screen bg-slatey-50 pb-24">
      <div className="sticky top-0 z-30 glass border-b border-slatey-100">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <button onClick={volver} aria-label="Volver" className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary-600" />
          </button>
          {d && (
            <div className="flex items-center gap-3 min-w-0">
              <SmartImage src={d.fotoUrl} alt={d.nombre} ratio="1/1" fallback="avatar" gravity="face" widths={[80, 160]} sizes="40px" className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slatey-900 font-display leading-tight truncate">{d.nombre}</h2>
                <p className="text-xs font-semibold text-slatey-600 truncate">{d.especialidades.map((e) => e.nombre).join(' · ') || 'Odontología general'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-7">
        {perfil.loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" aria-label="Cargando perfil" /></div>}
        {perfil.error && (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-slatey-100 bg-white p-8 text-center">
            <AlertCircle className="w-7 h-7 text-accent-600" />
            <p className="text-sm text-slatey-600">{selectedDentistId ? perfil.error : 'Elige un odontólogo para ver su perfil.'}</p>
            {selectedDentistId && <Button size="sm" onClick={perfil.reload}>Reintentar</Button>}
          </div>
        )}

        {d && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {d.colegiaturaVerificada && <Badge variant="success" size="sm"><BadgeCheck className="w-3.5 h-3.5" /> COP {d.numeroColegiatura} verificado</Badge>}
              {Number(d.totalResenas ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-slatey-900"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{Number(d.calificacion ?? 0).toFixed(1)} <span className="font-normal text-slatey-500">({d.totalResenas} reseñas)</span></span>
              )}
            </div>

            {(d.consultorio || d.direccion) && (
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-white border border-slatey-100">
                <Building2 className="w-4 h-4 text-slatey-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slatey-600">
                  {d.consultorio && <p className="font-semibold text-slatey-900">{d.consultorio}</p>}
                  <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {[d.direccion, d.distrito].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}

            <section>
              <h3 className="text-sm font-bold text-slatey-900 mb-2">Servicios</h3>
              {d.servicios.length === 0 ? <p className="text-xs text-slatey-500">Aún no publicó servicios.</p> : (
                <div className="space-y-2">
                  {d.servicios.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slatey-100">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slatey-900 truncate"><Stethoscope className="w-3.5 h-3.5 inline mr-1 text-primary-500" />{s.titulo}</p>
                        <p className="text-[11px] text-slatey-500">{s.categoria} · {s.duracionMinutos} min</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slatey-900">{soles(s.precioTotal)}</p>
                        <p className="text-[10px] text-slatey-500">Depósito {soles(s.montoDeposito)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {d.fotos.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-slatey-900 mb-2">Fotos del consultorio</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[...d.fotos].sort((a, b) => a.orden - b.orden).map((f, i) => (
                    <SmartImage key={f.id} src={f.url} alt={f.descripcion ?? `Consultorio ${i + 1}`} ratio="4/3" fallback="clinic" widths={[320, 640]} sizes="50vw" className="rounded-xl" />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-sm font-bold text-slatey-900 mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary-500" /> Horario de atención</h3>
              <div className="space-y-2">
                {DIAS_SEMANA.map((dia) => {
                  const tramos = d.horarios.filter((h) => h.diaSemana === dia.api);
                  return (
                    <div key={dia.api} className="flex justify-between px-3 py-2 rounded-xl bg-white border border-slatey-100">
                      <span className="text-sm font-medium text-slatey-700">{dia.label}</span>
                      <span className={`text-sm ${tramos.length ? 'font-semibold text-slatey-900' : 'text-slatey-500'}`}>
                        {tramos.length ? tramos.map((t) => `${hhmm(t.horaInicio)} - ${hhmm(t.horaFin)}`).join(' · ') : 'Cerrado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slatey-900 mb-2">Reseñas</h3>
              {resenas.loading && <Loader2 className="w-5 h-5 text-primary-500 animate-spin" aria-label="Cargando reseñas" />}
              {!resenas.loading && (resenas.data?.resenas ?? []).length === 0 && <p className="text-xs text-slatey-500">Todavía no tiene reseñas.</p>}
              <div className="space-y-2">
                {(resenas.data?.resenas ?? []).map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-white border border-slatey-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slatey-900">{r.paciente}</p>
                      <span className="flex items-center gap-0.5 text-xs font-bold text-slatey-900"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{r.calificacion}</span>
                    </div>
                    {r.comentario && <p className="text-xs text-slatey-600 mt-1 leading-relaxed">{r.comentario}</p>}
                    <p className="text-[10px] text-slatey-500 mt-1">{diaLima(r.creadoEn)}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-3">
              <Button fullWidth onClick={() => setScreen('marketplace')}>Reservar cita <ArrowRight className="w-4 h-4" /></Button>
              <Button fullWidth variant="outline" onClick={volver}>Volver</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
