/**
 * Re-exports the redesigned checkout from the modular checkout/ directory.
 * The original 503-line monolith has been replaced by:
 *
 *   src/screens/checkout/
 *   ├── index.tsx           — Orchestrator + state machine
 *   ├── types.ts            — PayState · PayMethod · Provider · CardFields
 *   ├── cardUtils.ts        — Luhn · formatCardNumber · formatExpiry
 *   ├── AppointmentSummary  — Collapsible summary with countdown
 *   ├── MethodSelector      — Yape / Plin / Tarjeta large buttons
 *   ├── QrPanel             — QR + steps + polling + op-number
 *   ├── CardPanel           — Card form with tokenization hook
 *   ├── TrustBadges         — Security + Ley 29733 notices
 *   ├── SuccessModal        — Drawn-check animation + receipt + calendar + WA
 *   └── RejectedModal       — Error + retry + method switch + hold notice
 */
export { default } from './checkout/index';