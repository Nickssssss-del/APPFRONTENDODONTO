import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useSyncExternalStore } from 'react';

// Store mínimo y reactivo: lo que Checkout lee y escribe de useApp().
const store = vi.hoisted(() => {
  const oyentes = new Set<() => void>();
  let version = 0;
  const estado: Record<string, unknown> = {};
  const cambiar = (k: string) => (v: unknown) => { estado[k] = v; version++; oyentes.forEach((f) => f()); };
  return {
    estado, oyentes, cambiar,
    version: () => version,
    pantallas: [] as string[],
  };
});

vi.mock('../../storeHooks', () => ({
  useApp: () => {
    useSyncExternalStore((f) => { store.oyentes.add(f); return () => store.oyentes.delete(f); }, store.version);
    return {
      ...store.estado,
      setScreen: (s: string) => { store.pantallas.push(s); },
      setActiveCita: store.cambiar('activeCita'),
      setSelectedSlotStart: store.cambiar('selectedSlotStart'),
      setSelectedTime: store.cambiar('selectedTime'),
      refreshAppointments: () => Promise.resolve(),
    };
  },
}));
// Funciones simples (no vi.fn): la config de Vitest restaura los mocks entre pruebas.
vi.mock('@/api/citas', () => ({
  configuracionPagos: () => Promise.resolve({ modo: 'simulado', modoPrueba: true, moneda: 'PEN', metodos: [] }),
  pagarDeposito: () => Promise.resolve(),
  reservarCita: () => Promise.resolve(),
}));
// El modal de éxito real solo aparece tras pagar; aquí se expone su botón para simular el clic.
vi.mock('./SuccessModal', () => ({
  SuccessModal: ({ onClose }: { onClose: () => void }) => <button onClick={onClose}>Ver mi cita</button>,
}));

import CheckoutScreen from './index';

afterEach(() => { cleanup(); store.pantallas.length = 0; });

describe('Checkout · «Ver mi cita» tras pagar', () => {
  it('termina en Mis citas y no en la ficha del odontólogo', async () => {
    Object.assign(store.estado, {
      selectedTreatment: { id: 's1', name: 'Limpieza', price: 100, deposit: 20 },
      selectedDay: 'Lunes', selectedTime: '10:00', selectedDentistName: 'Dra. Prueba', selectedDentistId: 'o1',
      selectedSlotStart: '2026-11-12T10:00:00-05:00',
      activeCita: {
        id: 'c1', estado: 'CONFIRMADA', inicio: '2026-11-12T10:00:00-05:00', fin: '2026-11-12T10:45:00-05:00',
        precio: 100, depositoRequerido: 20, odontologo: { id: 'o1', nombre: 'Dra. Prueba' }, servicio: { id: 's1', titulo: 'Limpieza' },
      },
    });
    render(<CheckoutScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ver mi cita' }));
    expect(store.pantallas[store.pantallas.length - 1]).toBe('misCitas');
    expect(store.pantallas).not.toContain('marketplace');
  });
});
