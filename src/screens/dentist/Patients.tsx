import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, ChevronRight, Users, Search, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { agendaOdontologo } from '@/api/citas';
import { agruparPacientes, iniciales } from '@/lib/pacientes';
import { diaLima, fechaIsoLima, horaLima, sumarDias } from '@/lib/format';

const DIAS_ATRAS = 180;
const DIAS_ADELANTE = 60;

type PatientsProps = {
  onGoToPatient: (pacienteId: string) => void;
};

export default function Patients({ onGoToPatient }: PatientsProps) {
  const [busqueda, setBusqueda] = useState('');
  const hoy = useMemo(() => fechaIsoLima(new Date()), []);
  // No existe un endpoint de pacientes: se arman con las citas de la agenda (hasta es exclusivo).
  const agenda = useAsync(() => agendaOdontologo(sumarDias(hoy, -DIAS_ATRAS), sumarDias(hoy, DIAS_ADELANTE)), [hoy]);

  const pacientes = useMemo(() => agruparPacientes(agenda.data ?? []), [agenda.data]);
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? pacientes.filter((p) => p.nombre.toLowerCase().includes(q) || (p.correo ?? '').toLowerCase().includes(q)) : pacientes;
  }, [pacientes, busqueda]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-slatey-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar paciente por nombre o correo"
          aria-label="Buscar paciente"
          className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slatey-200 bg-white text-sm focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slatey-900">Mis pacientes</h3>
        <Badge variant="primary" size="sm"><Users className="w-3 h-3" /> {pacientes.length}</Badge>
      </div>

      {agenda.loading && (
        <div className="flex justify-center py-10" aria-busy="true">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" aria-label="Cargando pacientes" />
        </div>
      )}
      {!agenda.loading && agenda.error && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-slatey-100 bg-white p-8 text-center">
          <AlertCircle className="w-7 h-7 text-accent-600" />
          <p className="text-sm text-slatey-600">{agenda.error}</p>
          <Button size="sm" onClick={agenda.reload}>Reintentar</Button>
        </div>
      )}
      {!agenda.loading && !agenda.error && visibles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slatey-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-slatey-900">{pacientes.length === 0 ? 'Aún no tienes pacientes' : 'Sin resultados'}</p>
          <p className="text-xs text-slatey-500 mt-1">
            {pacientes.length === 0 ? 'Los pacientes con una cita pagada aparecerán aquí.' : 'Prueba con otro nombre.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visibles.map((p, i) => {
          const tel = (p.telefono ?? '').replace(/\s/g, '');
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="bg-white rounded-2xl border border-slatey-100 p-4"
            >
              <button onClick={() => onGoToPatient(p.id)} className="w-full flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0" aria-hidden="true">
                  {iniciales(p.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slatey-900 truncate">{p.nombre}</p>
                  <p className="text-xs text-slatey-500 mt-0.5">
                    {p.visitas} {p.visitas === 1 ? 'visita atendida' : 'visitas atendidas'}
                    {p.ultimaCita ? ` · última: ${diaLima(p.ultimaCita)}` : ''}
                  </p>
                  {p.proxima && (
                    <p className="text-xs font-semibold text-primary-600 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Próxima: {diaLima(p.proxima.inicio)} · {horaLima(p.proxima.inicio)}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slatey-300 flex-shrink-0" />
              </button>
              {tel && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slatey-100">
                  <a href={`tel:${tel}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-success-50 text-success-700 text-xs font-bold hover:bg-success-100">
                    <Phone className="w-3.5 h-3.5" /> Llamar
                  </a>
                  <a href={`https://wa.me/${tel.replace(/^\+/, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-success-50 text-success-700 text-xs font-bold hover:bg-success-100">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
