import { useState, useCallback } from 'react';
import { Lock, CreditCard } from 'lucide-react';
import type { CardFields, CardErrors } from './types';
import { luhn, formatCardNumber, formatExpiry, validateExpiry } from './cardUtils';

interface Props {
  provider: 'culqi' | 'niubiz';
  /**
   * Called with a one-time token from the payment provider.
   * The parent must call the tokenization SDK here and receive the token.
   *
   * INTEGRATION POINT (Culqi / Niubiz):
   *   Culqi example:
   *     Culqi.createToken(cardData, (token) => onToken(token.id));
   *   Niubiz example:
   *     niubiz.tokenize(cardData).then((token) => onToken(token.transactionToken));
   *
   * Raw card numbers and CVV are NEVER stored in persistent state, logs, or
   * localStorage. They exist only in local React state for the lifetime of
   * this component and are cleared after tokenization.
   */
  onReadyToTokenize?: (fields: CardFields) => void;
  disabled?: boolean;
}

const FIELD_CLASS =
  'w-full px-4 py-3.5 rounded-2xl border-2 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:bg-white focus:outline-none transition-all';

export function CardPanel({ provider, onReadyToTokenize, disabled }: Props) {
  // Ephemeral state — never persisted
  const [fields, setFields] = useState<CardFields>({
    number: '',
    expiry: '',
    cvv: '',
    holder: '',
  });
  const [errors, setErrors] = useState<CardErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CardFields, boolean>>>({});

  const setField = useCallback(
    <K extends keyof CardFields>(key: K, value: CardFields[K]) => {
      setFields((prev) => ({ ...prev, [key]: value }));
      // Clear error on change
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  const validateField = useCallback(
    (key: keyof CardFields, value: string): string | undefined => {
      switch (key) {
        case 'number': {
          const raw = value.replace(/\s/g, '');
          if (!raw) return 'Ingresa el número de tarjeta';
          if (raw.length < 13) return 'Número incompleto';
          if (!luhn(raw)) return 'Número de tarjeta inválido';
          return undefined;
        }
        case 'expiry':
          if (!value) return 'Ingresa la fecha de vencimiento';
          return validateExpiry(value);
        case 'cvv':
          if (!value) return 'Ingresa el CVV';
          if (value.length < 3) return 'CVV debe tener 3 o 4 dígitos';
          return undefined;
        case 'holder':
          if (!value.trim()) return 'Ingresa el nombre del titular';
          if (value.trim().length < 3) return 'Nombre demasiado corto';
          return undefined;
      }
    },
    []
  );

  const handleBlur = (key: keyof CardFields) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({
      ...prev,
      [key]: validateField(key, fields[key]),
    }));
    // Notify parent when all fields are valid
    const allErrors: CardErrors = {};
    (Object.keys(fields) as Array<keyof CardFields>).forEach((k) => {
      allErrors[k] = validateField(k, fields[k]);
    });
    const valid = !Object.values(allErrors).some(Boolean);
    if (valid) onReadyToTokenize?.(fields);
  };

  const borderClass = (key: keyof CardFields) => {
    if (touched[key] && errors[key]) return 'border-error-400';
    if (touched[key] && !errors[key] && fields[key]) return 'border-success-400';
    return 'border-slatey-200 focus:border-primary-400';
  };

  return (
    <div className="bg-white rounded-2xl border border-slatey-100 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="w-4 h-4 text-primary-500" />
        <span className="text-xs font-semibold text-slatey-600 uppercase tracking-wide">
          Tarjeta de crédito o débito
        </span>
        <span className="ml-auto text-[10px] text-slatey-400 uppercase font-semibold">
          {provider}
        </span>
      </div>

      {/* Card number */}
      <div>
        <label className="block text-sm font-semibold text-slatey-700 mb-1.5">
          Número de tarjeta
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4111 1111 1111 1111"
          maxLength={19}
          value={fields.number}
          disabled={disabled}
          onChange={(e) => {
            setField('number', formatCardNumber(e.target.value));
          }}
          onBlur={() => handleBlur('number')}
          aria-invalid={touched.number && !!errors.number}
          aria-describedby={errors.number ? 'err-number' : undefined}
          className={`${FIELD_CLASS} ${borderClass('number')} font-mono tracking-widest`}
        />
        {touched.number && errors.number && (
          <p id="err-number" role="alert" className="mt-1 text-xs text-error-600 font-medium">
            {errors.number}
          </p>
        )}
      </div>

      {/* Holder */}
      <div>
        <label className="block text-sm font-semibold text-slatey-700 mb-1.5">
          Nombre en la tarjeta
        </label>
        <input
          type="text"
          autoComplete="cc-name"
          placeholder="Como aparece en la tarjeta"
          value={fields.holder}
          disabled={disabled}
          onChange={(e) => setField('holder', e.target.value.toUpperCase())}
          onBlur={() => handleBlur('holder')}
          aria-invalid={touched.holder && !!errors.holder}
          aria-describedby={errors.holder ? 'err-holder' : undefined}
          className={`${FIELD_CLASS} ${borderClass('holder')} uppercase`}
        />
        {touched.holder && errors.holder && (
          <p id="err-holder" role="alert" className="mt-1 text-xs text-error-600 font-medium">
            {errors.holder}
          </p>
        )}
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slatey-700 mb-1.5">
            Vencimiento
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            maxLength={5}
            value={fields.expiry}
            disabled={disabled}
            onChange={(e) => setField('expiry', formatExpiry(e.target.value))}
            onBlur={() => handleBlur('expiry')}
            aria-invalid={touched.expiry && !!errors.expiry}
            aria-describedby={errors.expiry ? 'err-expiry' : undefined}
            className={`${FIELD_CLASS} ${borderClass('expiry')}`}
          />
          {touched.expiry && errors.expiry && (
            <p id="err-expiry" role="alert" className="mt-1 text-xs text-error-600 font-medium">
              {errors.expiry}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slatey-700 mb-1.5">
            CVV
          </label>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="···"
            maxLength={4}
            value={fields.cvv}
            disabled={disabled}
            onChange={(e) => setField('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => handleBlur('cvv')}
            aria-invalid={touched.cvv && !!errors.cvv}
            aria-describedby={errors.cvv ? 'err-cvv' : undefined}
            className={`${FIELD_CLASS} ${borderClass('cvv')}`}
          />
          {touched.cvv && errors.cvv && (
            <p id="err-cvv" role="alert" className="mt-1 text-xs text-error-600 font-medium">
              {errors.cvv}
            </p>
          )}
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 pt-1">
        <Lock className="w-3.5 h-3.5 text-success-500 flex-shrink-0" />
        <p className="text-[11px] text-slatey-400 leading-snug">
          Tu tarjeta se tokeniza con {provider === 'culqi' ? 'Culqi' : 'Niubiz'}.
          Nunca guardamos tu número ni CVV.
        </p>
      </div>
    </div>
  );
}

