import { useAsync } from '@/hooks/useAsync';
import { agendaOdontologo, type CitaApi } from '@/api/citas';
import { historiasEscritasPara } from '@/api/panel';
import { sumarDias, fechaIsoLima } from '@/lib/format';

export function useCitasAntiguas(patientId: string) {
  const { data: citasAntiguas } = useAsync<CitaApi[]>(async (signal) => {
    const now = new Date();
    const from = sumarDias(fechaIsoLima(now), -365); // 1 year ago
    const to = fechaIsoLima(now);
    const allCitas = await agendaOdontologo(from, to);
    const existingHistories = await historiasEscritasPara(patientId, signal);
    const historiaIds = new Set<string>(existingHistories.map(h => h.citaId));
    const pending = allCitas.filter(cita => {
      const isCompleted = cita.estado === 'COMPLETADA';
      const isPatient = cita.paciente?.id === patientId;
      const notFuture = new Date(cita.inicio).getTime() <= now.getTime();
      const noHistory = !historiaIds.has(cita.id);
      return isCompleted && isPatient && notFuture && noHistory;
    });
    return pending;
  }, [patientId]);
  
  // The hook returns the filtered pending citations directly
  return citasAntiguas;
}