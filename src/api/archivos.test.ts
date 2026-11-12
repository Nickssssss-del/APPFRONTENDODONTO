// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validarImagen } from './archivos';

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
const HEIC = [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63];
const HTML = [...new TextEncoder().encode('<html><script>')];

const archivo = (bytes: number[], nombre: string, tipo: string, relleno = 0) =>
  new File([new Uint8Array([...bytes, ...new Array(relleno).fill(0)])], nombre, { type: tipo });

describe('validarImagen (firma de bytes)', () => {
  it('acepta JPG, PNG y WEBP reales', async () => {
    expect(await validarImagen(archivo(JPEG, 'a.jpg', 'image/jpeg'))).toBeNull();
    expect(await validarImagen(archivo(PNG, 'a.png', 'image/png'))).toBeNull();
    expect(await validarImagen(archivo(WEBP, 'a.webp', 'image/webp'))).toBeNull();
  });

  it('acepta un JPG del selector de Android 13 sin MIME ni extensión', async () => {
    expect(await validarImagen(archivo(JPEG, '1000012345', ''))).toBeNull();
  });

  it('rechaza un HTML renombrado como .jpg', async () => {
    expect(await validarImagen(archivo(HTML, 'foto.jpg', 'image/jpeg'))).toMatch(/JPG, PNG o WEBP/);
  });

  it('rechaza HEIC aunque el nombre diga .jpg', async () => {
    expect(await validarImagen(archivo(HEIC, 'foto.jpg', 'image/jpeg'))).toMatch(/HEIC/);
    expect(await validarImagen(archivo(JPEG, 'foto.heic', 'image/heic'))).toMatch(/HEIC/);
  });

  it('rechaza archivos vacíos y de más de 5 MB', async () => {
    expect(await validarImagen(new File([], 'vacia.jpg', { type: 'image/jpeg' }))).toMatch(/No se pudo leer/);
    expect(await validarImagen(archivo(JPEG, 'grande.jpg', 'image/jpeg', 5 * 1024 * 1024))).toMatch(/5 MB/);
  });
});

import { vi } from 'vitest';
const enviado = vi.hoisted(() => ({ ultimo: null as null | { path: string; form: FormData } }));
vi.mock('./http', () => ({
  api: async (path: string, opts: { form: FormData }) => { enviado.ultimo = { path, form: opts.form }; return {}; },
}));
import { agregarFotoConsultorio, subirDocumento, subirFotoPerfil } from './archivos';

describe('subida: el archivo viaja copiado en memoria y completo', () => {
  const original = () => new File([new Uint8Array([...JPEG, 1, 2, 3])], 'IMG_2026.jpg', { type: 'image/jpeg' });

  it.each([
    ['foto de perfil', () => subirFotoPerfil(original()), '/api/usuarios/yo/foto'],
    ['galería del consultorio', () => agregarFotoConsultorio(original()), '/api/odontologos/yo/fotos'],
  ])('%s', async (_n, subir, ruta) => {
    const f = original();
    await subir();
    const parte = enviado.ultimo!.form.get('archivo') as File;
    expect(enviado.ultimo!.path).toBe(ruta);
    expect(parte).not.toBe(f);
    expect(parte.name).toBe('IMG_2026.jpg');
    expect(parte.type).toBe('image/jpeg');
    expect(new Uint8Array(await parte.arrayBuffer())).toEqual(new Uint8Array(await f.arrayBuffer()));
  });

  it('documento PDF sin extensión ni MIME llega como PDF', async () => {
    const pdf = new File([new TextEncoder().encode('%PDF-1.7 contenido')], '1000099', { type: '' });
    await subirDocumento('DNI', pdf);
    const parte = enviado.ultimo!.form.get('archivo') as File;
    expect(parte.name).toBe('documento.pdf');
    expect(parte.type).toBe('application/pdf');
    expect(parte.size).toBe(pdf.size);
  });
});
