import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CitaApi } from '@/api/citas';
import { ApiError } from '@/api/http';
import { fechaIsoLima, rangoAgendaOdontologo, rangoAgendaValido } from '@/lib/format';

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

let erroresConsola: unknown[][];
beforeEach(() => {
  erroresConsola = [];
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { erroresConsola.push(a); });
  // jsdom no implementa scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
  // Reset all mocks
  vi.clearAllMocks();
});
afterEach(() => { cleanup(); });

// Hoy a mediodía en Lima: así la cita cae en el día seleccionado a cualquier hora en que corra la prueba.
const enUnaHora = `${fechaIsoLima(new Date())}T12:00:00-05:00`;
const cita: CitaApi = {
  id: 'c1', estado: 'CONFIRMADA', inicio: enUnaHora, fin: enUnaHora, zonaHoraria: 'America/Lima', precio: 120,
  depositoRequerido: 30, odontologo: { id: 'o1', nombre: 'Odontólogo' }, paciente: { id: 'p1', nombre: 'Prueba Uno' },
  servicio: { id: 's1', titulo: 'Evaluación' }, creadoEn: enUnaHora,
};

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
    await screen.findByText('Prueba Uno');
    // Expandir la cita para ver los botones (click en la tarjeta)
    const citaCard = screen.getByText('Prueba Uno').closest('button')!;
    fireEvent.click(citaCard);
    // Pulsar "No asistió"
    fireEvent.click(screen.getByRole('button', { name: /No asistió/i }));
    // Debe abrir el modal de confirmación
    expect(await screen.findByText('Registrar inasistencia')).toBeTruthy();
    expect(await screen.findByText(/Confirmas que.*no asistió/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Confirmar inasistencia/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeTruthy();
  });

  it('registra inasistencia tras confirmar en el modal y recarga la agenda', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockResolvedValue({ ...cita, estado: 'INASISTENCIA_PENALIZADA' });
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByText('Prueba Uno');
    const citaCard = screen.getByText('Prueba Uno').closest('button')!;
    fireEvent.click(citaCard);
    fireEvent.click(screen.getByRole('button', { name: /No asistió/i }));
    // Confirmar en el modal
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    await waitFor(() => expect(api.marcarInasistencia).toHaveBeenCalledWith('c1'));
    await waitFor(() => expect(api.agendaOdontologo).toHaveBeenCalledTimes(2)); // recarga tras éxito
  });

  it('muestra error del backend si falla la inasistencia y permite reintentar', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockRejectedValue(new ApiError(500, 'Error del servidor'));
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByText('Prueba Uno');
    const citaCard = screen.getByText('Prueba Uno').closest('button')!;
    fireEvent.click(citaCard);
    fireEvent.click(screen.getByRole('button', { name: /No asistió/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar inasistencia/i }));
    await waitFor(() => expect(screen.getByText('Error del servidor')).toBeTruthy());
    // El modal sigue abierto para permitir reintentar
    expect(screen.getByRole('button', { name: /Confirmar inasistencia/i })).toBeTruthy();
  });

  it('cancelar en el modal cierra sin ejecutar la acción', async () => {
    api.agendaOdontologo.mockResolvedValue([cita]);
    api.marcarInasistencia.mockResolvedValue({ ...cita, estado: 'INASISTENCIA_PENALIZADA' });
    render(<Agenda onGoToPatient={() => {}} />);
    await screen.findByText('Prueba Uno');
    const citaCard = screen.getByText('Prueba Uno').closest('button')!;
    fireEvent.click(citaCard);
    fireEvent.click(screen.getByRole('button', { name: /No asistió/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(api.marcarInasistencia).not.toHaveBeenCalled();
    expect(api.agendaOdontologo).toHaveBeenCalledTimes(1); // no recarga
  });

  it('botón "No asistió" deshabilitado en cita futura', async () => {
    // Cita para hoy en Lima a las 23:00 (definitivamente futura) - zona horaria Lima
    const hoyLima = fechaIsoLima(new Date());
    const citaFutura: CitaApi = {
      ...cita,
      id: 'c2',
      inicio: `${hoyLima}T23:00:00-05:00`, // 11 PM en Lima (definitivamente futura)
      fin: `${hoyLima}T23:59:00-05:00`,
    };
    api.agendaOdontologo.mockResolvedValue([citaFutura]);
    render(<Agenda onGoToPatient={() => {}} />);
    // Buscar la cita por el texto del servicio (puede estar dividido en elementos)
    await screen.findByText(/Evaluación/i);
    const citaCard = screen.getByText(/Evaluación/i).closest('button')!;
    fireEvent.click(citaCard);
    const btnNoAsistio = screen.getByRole('button', { name: /No asistió/i }) as HTMLButtonElement;
    expect(btnNoAsistio.disabled).toBe(true);
  });
});