import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ApiError } from '@/api/http';
import { borrarDatosOffline, fijarUsuarioOffline, guardarCopia } from '@/lib/offline';
import type { CitaApi } from '@/api/citas';

// DEF-08: «Mis citas» en modo avión debe mostrar las citas guardadas en el teléfono.

const red = vi.hoisted(() => ({ disponible: true, citas: [] as unknown[] }));

vi.mock('@/storeHooks', () => ({
  useApp: () => ({
    user: { fullName: 'Paciente Prueba' },
    setSelectedDentistId: () => {},
    setSelectedDentistName: () => {},
    setScreen: () => {},
    setActiveCita: () => {},
    setSelectedTreatment: () => {},
    setSelectedDay: () => {},
    setSelectedTime: () => {},
  }),
}));

vi.mock('@/api/citas', async (original) => ({
  ...(await original<typeof import('@/api/citas')>()),
  misCitas: () =>
    red.disponible
      ? Promise.resolve(red.citas)
      : Promise.reject(new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.')),
}));

import PatientAppointments from './PatientAppointments';

const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const cita: CitaApi = {
  id: 'c1',
  estado: 'CONFIRMADA',
  inicio: enUnaSemana.toISOString(),
  fin: new Date(enUnaSemana.getTime() + 45 * 60 * 1000).toISOString(),
  zonaHoraria: 'America/Lima',
  precio: 80,
  depositoRequerido: 16,
  odontologo: { id: 'o1', nombre: 'Manuel Salazar Torres', direccion: 'Av. Lima 931', distrito: 'Subtanjalla' },
  servicio: { id: 's1', titulo: 'Evaluación periodontal' },
  creadoEn: new Date().toISOString(),
};

afterEach(() => {
  cleanup();
  borrarDatosOffline();
  localStorage.clear();
  red.disponible = true;
  red.citas = [];
});

describe('Mis citas sin conexión (DEF-08)', () => {
  it('muestra la última copia guardada en lugar de dejar los contadores en 0', async () => {
    fijarUsuarioOffline('paciente-1');
    guardarCopia('citas', [cita]);
    red.disponible = false;

    render(<PatientAppointments />);

    expect(await screen.findByText('Manuel Salazar Torres')).toBeTruthy();
    expect(screen.getByText('Evaluación periodontal')).toBeTruthy();
    expect(screen.queryByText(/Sin conexión con el servidor|No pudimos conectar/)).toBeNull();
  });

  it('con conexión guarda las citas para poder verlas después sin internet', async () => {
    fijarUsuarioOffline('paciente-1');
    red.citas = [cita];
    render(<PatientAppointments />);
    expect(await screen.findByText('Manuel Salazar Torres')).toBeTruthy();
    cleanup();

    red.disponible = false;
    render(<PatientAppointments />);
    expect(await screen.findByText('Manuel Salazar Torres')).toBeTruthy();
  });

  it('sin conexión y sin copia guardada sigue mostrando el aviso con Reintentar', async () => {
    fijarUsuarioOffline('paciente-1');
    red.disponible = false;
    render(<PatientAppointments />);
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });
});
