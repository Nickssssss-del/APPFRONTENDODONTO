/*
# OdontoSystem v4.3 core data model

1. New Tables
- `profiles`: public user profile data linked to Supabase Auth, including role, DNI, phone and age.
- `appointments`: patient/dentist reservations with lifecycle status, hold expiration and payment evidence status.
- `clinical_notes`: dentist-authored clinical evolution notes linked to an appointment and patient.
- `dentist_schedule_blocks`: dentist availability blocks and emergency closures.

2. Important Columns
- `profiles.role`: patient or dentist role used by the application.
- `appointments.status`: PENDING_PAYMENT, CONFIRMED, COMPLETED, NO_SHOW or CANCELLED.
- `appointments.hold_expires_at`: server-visible temporary reservation expiration.
- `appointments.payment_status`: UNPAID, VERIFYING or PAID.
- `clinical_notes.content`: encrypted-at-rest-ready clinical note field owned by the dentist and readable by the patient.

3. Security
- Row Level Security is enabled on every new table.
- Profile rows are limited to the signed-in owner.
- Appointments are limited to the participating patient or dentist.
- Clinical notes are limited to the participating patient or dentist.
- Schedule blocks are limited to their dentist owner.
- Four separate CRUD policies are defined for every table; no FOR ALL policies are used.

4. Notes
- This migration is additive and does not drop, rename, or change existing data.
- The frontend can use the PENDING_PAYMENT -> CONFIRMED flow and the dashboard/clinical views against these tables.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('patient', 'dentist')),
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  dni text NOT NULL DEFAULT '',
  age integer,
  cop_number text,
  ruc text,
  biometric_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  guarantee numeric(10,2) NOT NULL DEFAULT 20 CHECK (guarantee >= 0),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED')),
  payment_status text NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'VERIFYING', 'PAID')),
  operation_number text,
  receipt_path text,
  hold_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dentist_schedule_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_emergency_closure boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentist_schedule_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_select_own" ON public.profiles;
CREATE POLICY "profile_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profile_insert_own" ON public.profiles;
CREATE POLICY "profile_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profile_update_own" ON public.profiles;
CREATE POLICY "profile_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profile_delete_own" ON public.profiles;
CREATE POLICY "profile_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "appointment_select_participant" ON public.appointments;
CREATE POLICY "appointment_select_participant" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = patient_id OR auth.uid() = dentist_id);
DROP POLICY IF EXISTS "appointment_insert_patient" ON public.appointments;
CREATE POLICY "appointment_insert_patient" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
DROP POLICY IF EXISTS "appointment_update_participant" ON public.appointments;
CREATE POLICY "appointment_update_participant" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = patient_id OR auth.uid() = dentist_id) WITH CHECK (auth.uid() = patient_id OR auth.uid() = dentist_id);
DROP POLICY IF EXISTS "appointment_delete_patient" ON public.appointments;
CREATE POLICY "appointment_delete_patient" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "clinical_note_select_participant" ON public.clinical_notes;
CREATE POLICY "clinical_note_select_participant" ON public.clinical_notes FOR SELECT TO authenticated USING (auth.uid() = patient_id OR auth.uid() = dentist_id);
DROP POLICY IF EXISTS "clinical_note_insert_dentist" ON public.clinical_notes;
CREATE POLICY "clinical_note_insert_dentist" ON public.clinical_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = dentist_id);
DROP POLICY IF EXISTS "clinical_note_update_dentist" ON public.clinical_notes;
CREATE POLICY "clinical_note_update_dentist" ON public.clinical_notes FOR UPDATE TO authenticated USING (auth.uid() = dentist_id) WITH CHECK (auth.uid() = dentist_id);
DROP POLICY IF EXISTS "clinical_note_delete_dentist" ON public.clinical_notes;
CREATE POLICY "clinical_note_delete_dentist" ON public.clinical_notes FOR DELETE TO authenticated USING (auth.uid() = dentist_id);

DROP POLICY IF EXISTS "schedule_select_own" ON public.dentist_schedule_blocks;
CREATE POLICY "schedule_select_own" ON public.dentist_schedule_blocks FOR SELECT TO authenticated USING (auth.uid() = dentist_id);
DROP POLICY IF EXISTS "schedule_insert_own" ON public.dentist_schedule_blocks;
CREATE POLICY "schedule_insert_own" ON public.dentist_schedule_blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = dentist_id);
DROP POLICY IF EXISTS "schedule_update_own" ON public.dentist_schedule_blocks;
CREATE POLICY "schedule_update_own" ON public.dentist_schedule_blocks FOR UPDATE TO authenticated USING (auth.uid() = dentist_id) WITH CHECK (auth.uid() = dentist_id);
DROP POLICY IF EXISTS "schedule_delete_own" ON public.dentist_schedule_blocks;
CREATE POLICY "schedule_delete_own" ON public.dentist_schedule_blocks FOR DELETE TO authenticated USING (auth.uid() = dentist_id);

CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_dentist_id_idx ON public.appointments(dentist_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS clinical_notes_patient_id_idx ON public.clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS schedule_dentist_date_idx ON public.dentist_schedule_blocks(dentist_id, block_date);
