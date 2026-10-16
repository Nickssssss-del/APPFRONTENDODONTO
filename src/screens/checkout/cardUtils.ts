/**
 * Validates a credit card number using the Luhn algorithm.
 * The raw digits must be passed (no spaces).
 */
export function luhn(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Formats a raw digit string as a card number: "4111111111111111" → "4111 1111 1111 1111" */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Formats raw digits as MM/YY: "0129" → "01/29" */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + '/' + digits.slice(2);
}

/**
 * Validates expiry string "MM/YY".
 * Returns an error message or undefined if valid.
 */
export function validateExpiry(value: string): string | undefined {
  const [mm, yy] = value.split('/');
  if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return 'Ingresa MM/AA válido';
  const month = parseInt(mm, 10);
  if (month < 1 || month > 12) return 'Mes inválido';
  const now = new Date();
  const cardYear = 2000 + parseInt(yy, 10);
  const cardMonth = month;
  if (
    cardYear < now.getFullYear() ||
    (cardYear === now.getFullYear() && cardMonth < now.getMonth() + 1)
  ) {
    return 'Tarjeta vencida';
  }
  return undefined;
}

