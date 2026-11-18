import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CitaApi } from '@/api/citas';
import { ApiError } from '@/api/http';
import { rangoAgendaOdontologo, rangoAgendaValido } from '@/lib/format';

const api = vi.hoisted(() => ({
  agendaOdontologo: vi.fn(),
  confirmarCita: vi.fn(),
  completarCita: vi.fn(),
  marcarInasistencia: vi.fn(),
}));
vi.mock('@/api/citas', () => ({
  agendaOdontologo: api.agendaOdontologo,
  confirmarCita: api.confirmarCita,
  completarCita: api.completarCita,
  marcarInasistencia: api.marcarInasistencia,
}));

import Agenda from './Agenda';

// Reloj fijo: miércoles 18/11/2026 a las 12:00 de Lima. Así las reglas de hora no dependen de cuándo corre el test.
// Solo se simula Date: setTimeout sigue siendo real y findBy/waitFor funcionan igual.
const AHORA = '2026-11-18T12:00:00-05:00';
const hoyLima = '2026-11-18';
const aLas = (hhmm: string) => `${hoyLima}T${hhmm}:00-05:00`;

let erroresConsola: unknown[][];
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(AHORA));
  erroresConsola = [];
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { erroresConsola.push(a); });
  // jsdom no implementa scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// Cita CONFIRMADA que empezó hace 1 h: ya pasó la tolerancia, así que «Atendida» y «No asistió» están disponibles.
const citaPasadaHoy = aLas('11:00');
const cita: CitaApi = {
  id: 'c1', estado: 'CONFIRMADA', inicio: citaPasadaHoy, fin: aLas('11:45'), zonaHoraria: 'America/Lima', precio: 120,
  depositoRequerido: 30, odontologo: { id: 'o1', nombre: 'Odontólogo' }, paciente: { id: 'p1', nombre: 'Prueba Uno' },
  servicio: { id: 's1', titulo: 'Evaluación' }, creadoEn: citaPasadaHoy,
};

/** Abre la tarjeta de la cita y devuelve sus dos botones de atención. */
async function botonesDeAtencion() {
  fireEvent.click(await screen.findByRole('button', { name: /Prueba Uno/i }));
  return {
    atendida: screen.getByRole('button', { name: /Atendida/i }) as HTMLButtonElement,
    noAsistio: screen.getByRole('button', { name: /No asistió/i }) as HTMLButtonElement,
  };
}

// Helper para abrir el modal de inasistencia
async function abrirModalInasistencia() {
  // Buscar la tarjeta de la cita por su nombre accesible (botón expandible)
  const citaCard = screen.getByRole('button', { name: /Prueba Uno/i });
  fireEvent.click(citaCard);
  fireEvent.click(screen.getByRole('button', { name: /No asistió/i }));
  // Esperar a que el modal se abra - usar findByRole para el título del modal
  await screen.findByRole('heading', { name: /Registrar inasistencia/i });
}

describe('Agenda del odontólogo', () => {
  it('pide un rango válido para el backend y muestra la cita con estado y monto', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    render(<Agenda onGoToPatient={() => {}} />);
    const [desde, hasta] = api.agendaOdontologo.mock.calls[0];
    expect(rangoAgendaValido(desde, hasta)).toBe(true);
    expect({ desde, hasta }).toEqual({ desde: rangoAgendaOdontologo().desde, hasta: rangoAgendaOdontologo().hastaExclusivo });
    expect(await screen.findByText('Prueba Uno')).toBeTruthy();
    expect(screen.getByText('1 cita')).toBeTruthy();
    expect(screen.getByText('Confirmada')).toBeTruthy();
    expect(screen.getByText('Total S/ 120.00')).toBeTruthy();
    expect(screen.getByRole('tab', { selected: true }).textContent).toContain('Hoy');
    expect(erroresConsola).toEqual([]);
  });

  it('muestra el mensaje real del backend si la consulta falla', async () => {
    api.agendaOdontologo.mockRejectedValue(new ApiError(400, 'El rango de la agenda debe ser de 1 a 62 días'));
    render(<Agenda onGoToPatient={() => {}} />);
    expect(await screen.findByText('No se pudo cargar la agenda')).toBeTruthy();
    expect(screen.getByText('El rango de la agenda debe ser de 1 a 62 días')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });

  it('día sin citas: estado vacío', async () => {
    api.agendaOdontologo.mockResolvedValue([]);
    render(<Agenda onGoToPatient={() => {}} />);
    expect(await screen.findByText('Sin citas este día')).toBeTruthy();
    expect(screen.getByText('0 citas')).toBeTruthy();
  });

  it('abre modal de confirmación al pulsar "No asistió" en cita confirmada y pasada', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockResolvedValue({ ...cita, estado: 'INASISTENCIA_PENALIZADA' });
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    await abrirModalInasistencia();
    // Debe abrir el modal de confirmación
    expect(screen.getByRole('heading', { name: /Registrar inasistencia/i })).toBeTruthy();
    expect(await screen.findByText(/Confirmas que.*no asistió/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Confirmar inasistencia/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeTruthy();
  });

  it('registra inasistencia tras confirmar en el modal y recarga la agenda', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockResolvedValue({ ...cita, estado: 'INASISTENCIA_PENALIZADA' });
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    await abrirModalInasistencia();
    // Confirmar en el modal
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    await waitFor(() => expect(api.marcarInasistencia).toHaveBeenCalledWith('c1'));
    await waitFor(() => expect(api.agendaOdontologo).toHaveBeenCalledTimes(2)); // recarga tras éxito
  });

  it('muestra error del backend si falla la inasistencia y permite reintentar', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockRejectedValue(new ApiError(500, 'Error del servidor'));
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    await abrirModalInasistencia();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    await waitFor(() => expect(screen.getByText('Error del servidor')).toBeTruthy());
    // El modal sigue abierto para permitir reintentar
    expect(screen.getByRole('button', { name: /Confirmar inasistencia/i })).toBeTruthy();
  });

  it('cancelar en el modal cierra sin ejecutar la acción', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockResolvedValue({ ...cita, estado: 'INASISTENCIA_PENALIZADA' });
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    await abrirModalInasistencia();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(api.marcarInasistencia).not.toHaveBeenCalled();
    expect(api.agendaOdontologo).toHaveBeenCalledTimes(1); // no recarga
  });

  it('pulsar "No asistió" no ejecuta acción directamente (usa modal)', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockResolvedValue({ ...cita, estado: 'INASISTENCIA_PENALIZADA' });
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    await abrirModalInasistencia();
    // No debería llamar a marcarInasistencia directamente, solo abrir modal
    expect(api.marcarInasistencia).not.toHaveBeenCalled();
  });

  it('registra inasistencia tras confirmar y actualiza UI sin cerrar modal hasta éxito', async () => {
    let resolvePromise: (value: CitaApi | PromiseLike<CitaApi>) => void = () => {};
    const pendingPromise = new Promise<CitaApi>((resolve) => { resolvePromise = resolve; });
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockImplementation(() => pendingPromise);
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    await abrirModalInasistencia();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    // El modal sigue abierto mientras la petición está pendiente
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar inasistencia/i }) as HTMLButtonElement;
    expect(btnConfirmar.disabled).toBe(true);
    // Resolver la promesa
    resolvePromise({ ...cita, estado: 'INASISTENCIA_PENALIZADA' });
    await waitFor(() => expect(api.agendaOdontologo).toHaveBeenCalledTimes(2));
  });

  it('muestra error del backend y permite reintentar sin cerrar modal', async () => {
    let resolvePromise: (value: CitaApi | PromiseLike<CitaApi>) => void = () => {};
    const pendingPromise = new Promise<CitaApi>((resolve) => { resolvePromise = resolve; });
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockImplementation(() => pendingPromise);
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    await abrirModalInasistencia();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    // Rechazar la promesa
    resolvePromise(Promise.reject(new ApiError(500, 'Error del servidor')));
    await waitFor(() => expect(screen.getByText('Error del servidor')).toBeTruthy());
    // El modal sigue abierto
    expect(screen.getByRole('button', { name: /Confirmar inasistencia/i })).toBeTruthy();
  });

  it('el botón "No asistió" se deshabilita si hay otra acción en curso', async () => {
    // Una petición que nunca termina: la acción queda en curso durante todo el test.
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockImplementation(() => new Promise<CitaApi>(() => {}));
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    await abrirModalInasistencia();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    // El segundo click no debería hacer nada porque hay una acción en curso
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    // Solo una llamada
    expect(api.marcarInasistencia).toHaveBeenCalledTimes(1);
  });

  describe('disponibilidad según la hora (reglas del backend)', () => {
    it('cita futura: «Atendida» y «No asistió» deshabilitados, con el motivo en pantalla', async () => {
      api.agendaOdontologo.mockResolvedValue([{ ...cita, id: 'c2', inicio: aLas('15:00'), fin: aLas('15:45') }]);
      render(<Agenda onGoToPatient={() => {}} />);
      const { atendida, noAsistio } = await botonesDeAtencion();
      expect(atendida.disabled).toBe(true);
      expect(noAsistio.disabled).toBe(true);
      expect(screen.getByText(/Podrás marcarla como atendida desde las 15:00/)).toBeTruthy();
      fireEvent.click(atendida);
      expect(api.completarCita).not.toHaveBeenCalled();
    });

    it('cita que empezó hace 10 min: «Atendida» habilitada y «No asistió» espera la tolerancia', async () => {
      api.agendaOdontologo.mockResolvedValue([{ ...cita, inicio: aLas('11:50'), fin: aLas('12:35') }]);
      render(<Agenda onGoToPatient={() => {}} />);
      const { atendida, noAsistio } = await botonesDeAtencion();
      expect(atendida.disabled).toBe(false);
      expect(noAsistio.disabled).toBe(true);
      expect(screen.getByText(/«No asistió» se habilita a las 12:05/)).toBeTruthy();
      fireEvent.click(noAsistio);
      expect(screen.queryByRole('heading', { name: /Registrar inasistencia/i })).toBeNull();
    });

    it('justo al vencer la tolerancia (inicio + 15 min) «No asistió» se habilita', async () => {
      api.agendaOdontologo.mockResolvedValue([{ ...cita, inicio: aLas('11:45'), fin: aLas('12:30') }]);
      render(<Agenda onGoToPatient={() => {}} />);
      const { noAsistio } = await botonesDeAtencion();
      expect(noAsistio.disabled).toBe(false);
      expect(screen.queryByText(/se habilita a las/)).toBeNull();
    });

    it('«Atendida» desde el inicio llama a PATCH …/completar y recarga la agenda', async () => {
      api.agendaOdontologo.mockResolvedValue([{ ...cita, inicio: aLas('12:00'), fin: aLas('12:45') }]);
      api.completarCita.mockResolvedValue({ ...cita, estado: 'COMPLETADA' });
      render(<Agenda onGoToPatient={() => {}} />);
      const { atendida } = await botonesDeAtencion();
      expect(atendida.disabled).toBe(false);
      fireEvent.click(atendida);
      await waitFor(() => expect(api.completarCita).toHaveBeenCalledWith('c1'));
      await waitFor(() => expect(api.agendaOdontologo).toHaveBeenCalledTimes(2));
    });

    it('si el backend rechaza «Atendida» se muestra su mensaje', async () => {
      api.agendaOdontologo.mockResolvedValue([cita]);
      api.completarCita.mockRejectedValue(new ApiError(409, 'La cita todavía no empieza'));
      render(<Agenda onGoToPatient={() => {}} />);
      const { atendida } = await botonesDeAtencion();
      fireEvent.click(atendida);
      expect(await screen.findByText('La cita todavía no empieza')).toBeTruthy();
    });
  });

  it('confirmar cita solo disponible en PENDIENTE_CONFIRMACION', async () => {
    const enUnaHora = `${hoyLima}T12:00:00-05:00`;
    const citaPendiente: CitaApi = {
      ...cita,
      id: 'c3',
      estado: 'PENDIENTE_CONFIRMACION',
      inicio: enUnaHora,
      fin: enUnaHora,
    };
    api.agendaOdontologo.mockResolvedValue([citaPendiente]);
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByRole('button', { name: /Prueba Uno/i });
    const citaCard = screen.getByRole('button', { name: /Prueba Uno/i });
    fireEvent.click(citaCard);
    expect(screen.getByRole('button', { name: /Confirmar cita/i })).toBeTruthy();
  });

  it('sin citas en día seleccionado muestra estado vacío', async () => {
    api.agendaOdontologo.mockResolvedValue([]);
    render(<Agenda onGoToPatient={() => {}} />);
    expect(await screen.findByText('Sin citas este día')).toBeTruthy();
    expect(screen.getByText('0 citas')).toBeTruthy();
  });
});