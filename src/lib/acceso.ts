import type { Role, Screen } from '@/types';

/** Se ven sin sesión. El catálogo y la ficha pública de un consultorio también. */
const PUBLICAS = new Set<Screen>(['splash', 'tutorial', 'onboarding', 'marketplace', 'dentistProfile']);

/** Solo el paciente. El chatbot no está aquí: lo abren los dos roles. */
const SOLO_PACIENTE = new Set<Screen>([
  'patientDashboard',
  'misCitas',
  'notificaciones',
  'checkout',
  'confirmarCita',
  'patientProfile',
  'apelacion',
]);

const SOLO_ODONTOLOGO = new Set<Screen>(['dentistPanel']);

/** Requieren JWT. El backend sigue autorizando cada petición. */
const REQUIERE_SESION = new Set<Screen>([...SOLO_PACIENTE, ...SOLO_ODONTOLOGO, 'chatbot']);

const PREVIAS_AL_LOGIN = new Set<Screen>(['splash', 'tutorial', 'onboarding']);

export type ContextoAcceso = {
  sessionLoading: boolean;
  isAuth: boolean;
  perfilListo: boolean;
  role: Role;
};

/**
 * Pantalla que sí puede mostrarse. Durante la carga o antes de /api/usuarios/yo
 * no se adivina el rol: el valor por defecto es paciente y un odontólogo acabaría en el panel equivocado.
 */
export function pantallaVisible(screen: Screen, ctx: ContextoAcceso): Screen {
  if (ctx.sessionLoading) return screen;
  if (ctx.isAuth && !ctx.perfilListo) return screen;
  if (!ctx.isAuth) return REQUIERE_SESION.has(screen) ? 'onboarding' : screen;

  const inicio: Screen = ctx.role === 'dentist' ? 'dentistPanel' : 'patientDashboard';
  if (PREVIAS_AL_LOGIN.has(screen)) return inicio;
  if (ctx.role === 'patient' && SOLO_ODONTOLOGO.has(screen)) return 'patientDashboard';
  if (ctx.role === 'dentist' && SOLO_PACIENTE.has(screen)) return inicio;
  if (!PUBLICAS.has(screen) && !REQUIERE_SESION.has(screen)) return inicio;
  return screen;
}
