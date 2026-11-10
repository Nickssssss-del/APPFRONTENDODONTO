import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CitaApi } from '@/api/citas';
import type { Historia, PacienteDetalle } from '@/api/panel';
import { ApiError } from '@/api/http';
import { rangoAgendaValido } from '@/lib/format';

const api = vi.hoisted(() => ({
  detallePaciente: vi.fn(),
  historiasEscritasPara: vi.fn(),
  registrarHistoria: vi.fn(),
  agendaOdontologo: vi.fn(),
}));
vi.mock('@/api/panel', () => ({
  detallePaciente: api.detallePaciente,
  historiasEscritasPara: api.historiasEscritasPara,
  registrarHistoria: api.registrarHistoria,
}));
vi.mock('@/api/citas', () => ({ agendaOdontologo: api.agendaOdontologo }));

import PatientDetail from './PatientDetail';

const nunca = () => new Promise<never>(() => {});
const ahora = Date.now();
const iso = (diasAtras: number) => new Date(ahora - diasAtras * 86_400_000 - 3_600_000).toISOString();

const detalle = (citasAtendidas: number): PacienteDetalle => ({
  id: 'p1', nombre: 'Prueba', apellido: 'Uno', nombreCompleto: 'Prueba Uno', telefono: '900000001', correo: 'prueba@ejemplo.test',
  alergias: null, antecedentes: null, citasAtendidas,
});
const cita = (id: string, diasAtras: number): CitaApi => ({
  id, estado: 'COMPLETADA', inicio: iso(diasAtras), fin: iso(diasAtras), zonaHoraria: 'America/Lima', precio: 100,
  depositoRequerido: 30, odontologo: { id: 'o1', nombre: 'Odontólogo' }, paciente: { id: 'p1', nombre: 'Prueba Uno' },
  servicio: { id: 's1', titulo: `Servicio ${id}` }, creadoEn: iso(diasAtras),
});
const historia = (citaId: string, diasAtras: number): Historia => ({
  id: Number(citaId.length), citaId, pacienteId: 'p1', odontologo: 'Odontólogo', servicio: `Servicio ${citaId}`,
  fechaCita: iso(diasAtras), diagnostico: `Diagnóstico ${citaId}`, tratamiento: `Tratamiento ${citaId}`, creadoEn: iso(diasAtras),
});

let erroresConsola: unknown[][];
beforeEach(() => {
  erroresConsola = [];
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { erroresConsola.push(a); });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const montar = () => render(<PatientDetail patientId="p1" onBack={() => {}} volverEtiqueta="Volver a Pacientes" />);

describe('PatientDetail', () => {
  it('se muestra mientras las consultas están pendientes (sin TypeError)', () => {
    api.detallePaciente.mockImplementation(nunca);
    api.historiasEscritasPara.mockImplementation(nunca);
    api.agendaOdontologo.mockImplementation(nunca);
    montar();
    expect(screen.getByText('Volver a Pacientes')).toBeTruthy();
    expect(screen.getByLabelText('Cargando datos del paciente')).toBeTruthy();
    expect(screen.getByText('0 registros')).toBeTruthy();
    expect(erroresConsola).toEqual([]);
  });

  it('con colecciones vacías muestra el estado vacío y no consulta la agenda', async () => {
    api.detallePaciente.mockResolvedValue(detalle(0));
    api.historiasEscritasPara.mockResolvedValue([]);
    api.agendaOdontologo.mockResolvedValue([]);
    montar();
    expect(await screen.findByText('Sin historia clínica todavía')).toBeTruthy();
    expect(screen.getByText('0 visitas atendidas')).toBeTruthy();
    expect(api.agendaOdontologo).not.toHaveBeenCalled();
    expect(erroresConsola).toEqual([]);
  });

  it('los errores de consulta no bloquean la pantalla y ofrecen reintentar', async () => {
    api.detallePaciente.mockRejectedValue(new ApiError(500, 'Detalle no disponible'));
    api.historiasEscritasPara.mockRejectedValue(new ApiError(500, 'Historias no disponibles'));
    api.agendaOdontologo.mockRejectedValue(new ApiError(400, 'El rango de la agenda debe ser de 1 a 62 días'));
    montar();
    expect(await screen.findByText('Detalle no disponible')).toBeTruthy();
    expect(await screen.findByText('Historias no disponibles')).toBeTruthy();
    expect(await screen.findByText('El rango de la agenda debe ser de 1 a 62 días')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Reintentar' }).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('Volver a Pacientes')).toBeTruthy();
  });

  it('lista citas atendidas anteriores sin historia (M1) con rangos válidos', async () => {
    api.detallePaciente.mockResolvedValue(detalle(3));
    api.historiasEscritasPara.mockResolvedValue([historia('c-old', 10)]);
    api.agendaOdontologo.mockImplementation(async (desde: string, hasta: string) =>
      [cita('c-ayer', 1), cita('c-old', 10), cita('c-90', 90)].filter((c) => {
        const f = c.inicio.slice(0, 10);
        return f >= desde && f < hasta;
      }));
    montar();
    expect(await screen.findByText('2 citas atendidas sin historia clínica.')).toBeTruthy();
    expect(await screen.findByText('Servicio c-ayer')).toBeTruthy();
    expect(screen.getByText('Servicio c-90')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Registrar/ })).toHaveLength(2);
    for (const [desde, hasta] of api.agendaOdontologo.mock.calls) expect(rangoAgendaValido(desde, hasta)).toBe(true);
    expect(erroresConsola).toEqual([]);
  });

  it('registra una historia y actualiza lista y contador sin recargar', async () => {
    api.detallePaciente.mockResolvedValue(detalle(1));
    api.historiasEscritasPara.mockResolvedValueOnce([]).mockResolvedValue([historia('c-ayer', 1)]);
    api.agendaOdontologo.mockResolvedValue([cita('c-ayer', 1)]);
    api.registrarHistoria.mockResolvedValue(historia('c-ayer', 1));
    montar();
    fireEvent.click(await screen.findByRole('button', { name: /Registrar/ }));
    const [diag, trat] = screen.getAllByRole('textbox');
    fireEvent.change(diag, { target: { value: 'Diagnóstico c-ayer' } });
    fireEvent.change(trat, { target: { value: 'Tratamiento c-ayer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.registrarHistoria).toHaveBeenCalledWith('c-ayer', { diagnostico: 'Diagnóstico c-ayer', tratamiento: 'Tratamiento c-ayer', notas: undefined }));
    expect(await screen.findByText('1 registro')).toBeTruthy();
    expect(screen.queryByText(/sin historia clínica\./)).toBeNull();
    expect(screen.queryByRole('button', { name: /Registrar/ })).toBeNull(); // no se puede registrar dos veces
    expect(api.agendaOdontologo).toHaveBeenCalledTimes(1); // no se repite la búsqueda
    expect(erroresConsola).toEqual([]);
  });

  it('ante un 409 muestra el mensaje del backend y recarga las historias', async () => {
    api.detallePaciente.mockResolvedValue(detalle(1));
    api.historiasEscritasPara.mockResolvedValue([]);
    api.agendaOdontologo.mockResolvedValue([cita('c-ayer', 1)]);
    api.registrarHistoria.mockRejectedValue(new ApiError(409, 'Esta cita ya tiene historia clínica'));
    montar();
    fireEvent.click(await screen.findByRole('button', { name: /Registrar/ }));
    const [diag, trat] = screen.getAllByRole('textbox');
    fireEvent.change(diag, { target: { value: 'x' } });
    fireEvent.change(trat, { target: { value: 'y' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Esta cita ya tiene historia clínica')).toBeTruthy();
    await waitFor(() => expect(api.historiasEscritasPara).toHaveBeenCalledTimes(2));
  });
});
