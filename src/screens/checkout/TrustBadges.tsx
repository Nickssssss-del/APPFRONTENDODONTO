import { FileText, ShieldCheck, Lock } from 'lucide-react';

export function TrustBadges() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-success-50 border border-success-100">
        <ShieldCheck className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-success-800 leading-relaxed">
          <strong>Pago 100% seguro.</strong> Tu depósito es reembolsable si
          cancelas con 24 h de anticipación.
        </p>
      </div>

      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-primary-50 border border-primary-100">
        <FileText className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-primary-800 leading-relaxed">
          El odontólogo emitirá tu boleta o factura al terminar la cita, por el
          total del servicio.
        </p>
      </div>

      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-slatey-50 border border-slatey-100">
        <Lock className="w-4 h-4 text-slatey-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slatey-600 leading-relaxed">
          Tus datos personales están protegidos bajo la{' '}
          <strong>Ley N.° 29733</strong> de protección de datos personales del
          Perú.
        </p>
      </div>
    </div>
  );
}

