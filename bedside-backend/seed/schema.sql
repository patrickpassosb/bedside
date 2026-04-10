-- Bedside Database Schema v2
-- Run this SQL in the Supabase SQL Editor to create all tables.
-- Do not modify column names or types — they must match SCHEMA_v2.md exactly.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- hospitals
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  condition TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  ward TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attending_physician TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  preferred_language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  title TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  location TEXT,
  preparation_notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- medication_requests
CREATE TABLE IF NOT EXISTS medication_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT NOT NULL,
  reason TEXT NOT NULL,
  next_due_time TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- conversation_logs
CREATE TABLE IF NOT EXISTS conversation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  direction TEXT NOT NULL,
  message_text TEXT NOT NULL,
  detected_language TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  intent_detected TEXT NOT NULL,
  handler_used TEXT NOT NULL,
  input_summary TEXT,
  response_summary TEXT,
  detected_language TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- escalations
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- consent_flags
CREATE TABLE IF NOT EXISTS consent_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  patient_id UUID NOT NULL UNIQUE REFERENCES patients(id),
  family_sharing_enabled BOOLEAN NOT NULL DEFAULT false,
  family_share_token TEXT NOT NULL UNIQUE DEFAULT uuid_generate_v4()::TEXT,
  consented_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- nurse_messages
CREATE TABLE IF NOT EXISTS nurse_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  message_text TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Supabase Realtime on required tables
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE escalations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE nurse_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
