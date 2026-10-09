/**
 * Re-exports the redesigned patient profile from the modular patientProfile/ directory.
 * The original 141-line monolith has been replaced by:
 *
 *   src/screens/patientProfile/
 *   ├── index.tsx           — Orchestrator + independent loading states
 *   ├── types.ts            — ProfileTab · LoadState · PatientAppointmentRow · ReceiptRow
 *   ├── mockData.ts         — Mock appointments, clinical history, receipts (never persisted)
 *   ├── ProfileHeader.tsx   — Avatar (SmartImage gravity:face) + crop picker + masked DNI + badges
 *   ├── TabBar.tsx          — Accessible tablist (role/aria-selected/aria-controls + focus ring)
 *   ├── States.tsx          — Skeleton · ResumenSkeleton · HistorialSkeleton · EmptyState · ErrorState
 *   ├── ResumenTab.tsx      — Next appointment + metrics + strike meter + recent history
 *   ├── HistorialTab.tsx    — Timeline + type filter chips + SmartImage contain + fullscreen viewer
 *   ├── OdontogramaTab.tsx  — Read-only FDI odontogram (32 teeth) with detail popover
 *   ├── ComprobantesTab.tsx — Receipt list with status, amounts, PDF download stub
 *   └── SettingsSection.tsx — Biometría · Notificaciones · Calendar · Datos-deletion · Logout
 */
export { default } from './patientProfile/index';