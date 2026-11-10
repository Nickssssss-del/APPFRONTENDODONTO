import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { CitaApi } from '@/api/citas';
import { ApiError } from '@/api/http';
import { rangoAgendaOdontologo, rangoAgendaValido } from '@/lib/format';

const api = vi.hoisted(() => ({ agendaOdontologo: vi.fn() }));
vi.mock('@/api/citas', () => ({
  agendaOdontologo: api.agendaOdontologo,
  confirmarCita: vi.fn(),
  completarCita: vi.fn(),
  marcarInasistencia: vi.fn(),
}));

import Agenda from './Agenda';

let erroresConsola: unknown[][];
beforeEach(() => {
  erroresConsola = [];
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { erroresConsola.push(a); });
  // jsdom no implementa scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const enUnaHora = new Date(Date.now() + 3_600_000).toISOString();
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
});
