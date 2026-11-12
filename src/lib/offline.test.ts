import { afterEach, describe, expect, it } from 'vitest';
import { ApiError, conCopiaOffline } from '@/api/http';
import { borrarDatosOffline, fijarUsuarioOffline, guardarCopia, leerCopia, useEstadoConexion, type RecursoOffline } from './offline';
import { renderHook } from '@testing-library/react';

afterEach(() => {
  borrarDatosOffline();
  localStorage.clear();
});

const sinRed = () => Promise.reject(new ApiError(0, 'No pudimos conectar con el servidor.'));

describe('copias sin conexión', () => {
  it('guarda la respuesta con conexión y la devuelve sin conexión, avisando a la interfaz', async () => {
    fijarUsuarioOffline('u1');
    await conCopiaOffline('citas', async () => [{ id: 'c1' }]);
    const { result } = renderHook(() => useEstadoConexion());
    expect(result.current.sinConexion).toBe(false);

    const datos = await conCopiaOffline('citas', sinRed);
    expect(datos).toEqual([{ id: 'c1' }]);
    const { result: despues } = renderHook(() => useEstadoConexion());
    expect(despues.current.sinConexion).toBe(true);
    expect(despues.current.datosDe).toBeTypeOf('number');
  });

  it('sin copia guardada propaga el error de conexión', async () => {
    fijarUsuarioOffline('u1');
    await expect(conCopiaOffline('agenda', sinRed)).rejects.toThrow('No pudimos conectar');
  });

  it('los errores del servidor (4xx/5xx) no se tapan con la copia', async () => {
    fijarUsuarioOffline('u1');
    guardarCopia('citas', [{ id: 'vieja' }]);
    await expect(conCopiaOffline('citas', () => Promise.reject(new ApiError(403, 'Prohibido')))).rejects.toThrow('Prohibido');
  });

  it('cada usuario ve solo sus copias; cambiar de usuario borra las anteriores', () => {
    fijarUsuarioOffline('u1');
    guardarCopia('citas', ['de u1']);
    fijarUsuarioOffline('u2');
    expect(leerCopia('citas')).toBeNull();
  });

  it('se aplica el saneado antes de guardar (p. ej. sin DNI)', async () => {
    fijarUsuarioOffline('u1');
    await conCopiaOffline('perfil', async () => ({ id: 'u1', numeroDocumento: '12345678' }), {
      sanear: (yo) => ({ ...yo, numeroDocumento: '' }),
    });
    expect(JSON.stringify(localStorage)).not.toContain('12345678');
  });

  it('solo existen copias de perfil, citas y agenda (nunca historias clínicas)', () => {
    fijarUsuarioOffline('u1');
    guardarCopia('historias' as RecursoOffline, [{ diagnostico: 'x' }]);
    expect(Object.keys(localStorage).some((k) => k.includes('historias'))).toBe(false);
  });

  it('borrar los datos (cerrar sesión) elimina todas las copias', () => {
    fijarUsuarioOffline('u1');
    guardarCopia('agenda', [1]);
    borrarDatosOffline();
    expect(Object.keys(localStorage).filter((k) => k.startsWith('odonto_offline'))).toEqual([]);
  });
});
