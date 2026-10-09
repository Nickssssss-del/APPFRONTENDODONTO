import { api } from './http';

/** GET /api/usuarios/yo — datos del usuario con sesión iniciada (incluye foto_perfil_url). */
export type UsuarioYo = {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  rol: 'PACIENTE' | 'ODONTOLOGO';
  fotoPerfilUrl?: string | null;
};

export const obtenerYo = () => api<UsuarioYo>('/api/usuarios/yo');
export const actualizarYo = (datos: { nombreCompleto?: string; telefono?: string }) =>
  api<UsuarioYo>('/api/usuarios/yo', { method: 'PATCH', body: datos });
