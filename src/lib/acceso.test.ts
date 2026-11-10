import { describe, expect, it } from 'vitest';
import type { Screen } from '@/types';
import { pantallaVisible, type ContextoAcceso } from './acceso';

const paciente: ContextoAcceso = { sessionLoading: false, isAuth: true, perfilListo: true, role: 'patient' };
const odontologo: ContextoAcceso = { ...paciente, role: 'dentist' };
const anonimo: ContextoAcceso = { sessionLoading: false, isAuth: false, perfilListo: false, role: 'patient' };

const SOLO_PACIENTE: Screen[] = ['patientDashboard', 'misCitas', 'notificaciones', 'checkout', 'confirmarCita', 'patientProfile', 'apelacion'];

describe('pantallaVisible: PACIENTE vs ODONTOLOGO', () => {
  it.each(SOLO_PACIENTE)('el odontólogo no ve %s', (s) => {
    expect(pantallaVisible(s, odontologo)).toBe('dentistPanel');
  });

  it.each(SOLO_PACIENTE)('el paciente sí ve %s', (s) => {
    expect(pantallaVisible(s, paciente)).toBe(s);
  });

  it('el paciente no ve el panel del odontólogo', () => {
    expect(pantallaVisible('dentistPanel', paciente)).toBe('patientDashboard');
  });

  it('el odontólogo ve su panel y el chatbot', () => {
    expect(pantallaVisible('dentistPanel', odontologo)).toBe('dentistPanel');
    expect(pantallaVisible('chatbot', odontologo)).toBe('chatbot');
  });

  it.each([...SOLO_PACIENTE, 'dentistPanel', 'chatbot'] as Screen[])('sin sesión, %s lleva al inicio de sesión', (s) => {
    expect(pantallaVisible(s, anonimo)).toBe('onboarding');
  });

  it.each(['marketplace', 'dentistProfile', 'onboarding'] as Screen[])('sin sesión, %s es público', (s) => {
    expect(pantallaVisible(s, anonimo)).toBe(s);
  });

  it('con sesión, las pantallas previas al login llevan al inicio del rol', () => {
    expect(pantallaVisible('onboarding', paciente)).toBe('patientDashboard');
    expect(pantallaVisible('splash', odontologo)).toBe('dentistPanel');
  });

  it('no decide nada mientras el rol no está confirmado', () => {
    expect(pantallaVisible('dentistPanel', { ...paciente, perfilListo: false })).toBe('dentistPanel');
    expect(pantallaVisible('misCitas', { ...anonimo, sessionLoading: true })).toBe('misCitas');
  });
});
