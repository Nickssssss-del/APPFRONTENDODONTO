import { describe, it, expect, vi, afterEach } from 'vitest';
import { luhn, formatCardNumber, formatExpiry, validateExpiry } from './cardUtils';

describe('luhn', () => {
  it('acepta tarjetas válidas (Visa y Mastercard de prueba)', () => {
    expect(luhn('4111111111111111')).toBe(true);
    expect(luhn('5555555555554444')).toBe(true);
  });
  it('acepta número con espacios', () => {
    expect(luhn('4111 1111 1111 1111')).toBe(true);
  });
  it('rechaza un dígito alterado', () => {
    expect(luhn('4111111111111112')).toBe(false);
  });
  it('rechaza longitud fuera de 13-19 dígitos', () => {
    expect(luhn('123456789012')).toBe(false);
    expect(luhn('12345678901234567890')).toBe(false);
  });
  it('rechaza vacío y texto', () => {
    expect(luhn('')).toBe(false);
    expect(luhn('abcd')).toBe(false);
  });
});

describe('formatCardNumber', () => {
  it('agrupa de 4 en 4', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });
  it('ignora letras y limita a 16 dígitos', () => {
    expect(formatCardNumber('41a11-1111 1111 1111 9999')).toBe('4111 1111 1111 1111');
  });
  it('vacío devuelve vacío', () => {
    expect(formatCardNumber('')).toBe('');
  });
});

describe('formatExpiry', () => {
  it('inserta la barra después del mes', () => {
    expect(formatExpiry('0129')).toBe('01/29');
    expect(formatExpiry('012')).toBe('01/2');
  });
  it('no agrega barra con 2 dígitos o menos', () => {
    expect(formatExpiry('01')).toBe('01');
    expect(formatExpiry('0')).toBe('0');
  });
  it('limita a 4 dígitos', () => {
    expect(formatExpiry('012999')).toBe('01/29');
  });
});

describe('validateExpiry', () => {
  afterEach(() => vi.useRealTimers());

  it('rechaza formato incompleto', () => {
    expect(validateExpiry('')).toBe('Ingresa MM/AA válido');
    expect(validateExpiry('1/29')).toBe('Ingresa MM/AA válido');
    expect(validateExpiry('01/2')).toBe('Ingresa MM/AA válido');
  });
  it('rechaza mes inválido', () => {
    expect(validateExpiry('00/30')).toBe('Mes inválido');
    expect(validateExpiry('13/30')).toBe('Mes inválido');
  });
  it('rechaza tarjeta vencida', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T12:00:00Z'));
    expect(validateExpiry('10/26')).toBe('Tarjeta vencida');
    expect(validateExpiry('12/25')).toBe('Tarjeta vencida');
  });
  it('acepta el mes actual y fechas futuras', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T12:00:00Z'));
    expect(validateExpiry('11/26')).toBeUndefined();
    expect(validateExpiry('01/30')).toBeUndefined();
  });
});
