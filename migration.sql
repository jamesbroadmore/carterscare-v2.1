-- ============================================================
-- CartersCare Full Schema Migration for new Supabase project
-- Includes new pricing columns on clients table
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- staff (must come before tables that reference it)
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  preferred_name text,
  email text NOT NULL,
  phone text,
  date_of_birth date,
  address text,
  role text NOT NULL DEFAULT 'support_worker',
  employment_type text NOT NULL DEFAULT 'casual',
  status text NOT NULL DEFAULT 'active',
  start_date date,
  qualifications text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- clients (with NEW pricing columns)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  preferred_name text,
  email text,
  phone text,
  date_of_birth date,
  address text,
  suburb text,
  state text,
  postcode text,
  funding_type text,
  ndis_number text,
  ndis_plan_start date,
  ndis_plan_end date,
  primary_disability text,
  support_needs text,
  plan_manager text,
  support_coordinator text,
  status text NOT NULL DEFAULT 'active',
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  notes text,
  goals text,
  medical_conditions text,
  allergies text,
  medications text,
  gp_name text,
  risk_assessment text,
  gender text,
  -- NEW: Agreed pricing columns
  rate_weekday numeric,
  rate_saturday numeric,
  rate_sunday numeric,
  rate_public_holiday numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  staff_id uuid REFERENCES public.staff(id),
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL
);

-- role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role text NOT NULL,
  resource text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- organisation_settings
CREATE TABLE IF NOT EXISTS public.organisation_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- client_staff_assignments
CREATE TABLE IF NOT EXISTS public.client_staff_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- client_funding
CREATE TABLE IF NOT EXISTS public.client_funding (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  funding_program text NOT NULL,
  plan_number text,
  plan_start_date date,
  plan_end_date date,
  total_budget numeric,
  budget_used numeric,
  approved_categories text[],
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- care_plans
CREATE TABLE IF NOT EXISTS public.care_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  plan_name text NOT NULL,
  start_date date,
  end_date date,
  goals text[],
  approved_services text[],
  status text DEFAULT 'active',
  document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- service_agreements
CREATE TABLE IF NOT EXISTS public.service_agreements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  agreement_date date NOT NULL DEFAULT CURRENT_DATE,
  signed boolean DEFAULT false,
  status text DEFAULT 'active',
  document_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- service_categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_code text NOT NULL,
  category_name text NOT NULL,
  funding_program text NOT NULL,
  description text,
  max_rate numeric,
  weekend_rate_multiplier numeric,
  public_holiday_rate_multiplier numeric,
  gst_applicable boolean DEFAULT false,
  requires_qualification text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- case_notes
CREATE TABLE IF NOT EXISTS public.case_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  staff_id uuid REFERENCES public.staff(id),
  content text NOT NULL,
  category text,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  is_confidential boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- incidents
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.clients(id),
  incident_type text NOT NULL,
  incident_date date NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  status text NOT NULL DEFAULT 'open',
  description text NOT NULL,
  location text,
  immediate_action text,
  injury_occurred boolean DEFAULT false,
  medical_attention_required boolean DEFAULT false,
  follow_up_required boolean DEFAULT false,
  follow_up_notes text,
  reported_by uuid REFERENCES public.staff(id),
  resolved_by uuid REFERENCES public.staff(id),
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- shifts
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.clients(id),
  staff_id uuid REFERENCES public.staff(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  service_type text,
  status text DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number text NOT NULL UNIQUE,
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  abn text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- invoice_line_items
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  client_id uuid REFERENCES public.clients(id),
  description text NOT NULL,
  hours numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  service_date date,
  service_category_id uuid REFERENCES public.service_categories(id),
  funding_program text,
  timesheet_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- billing_validations
CREATE TABLE IF NOT EXISTS public.billing_validations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid REFERENCES public.invoices(id),
  timesheet_id uuid,
  validation_type text NOT NULL,
  message text NOT NULL,
  passed boolean NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- timesheets
CREATE TABLE IF NOT EXISTS public.timesheets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  client_id uuid REFERENCES public.clients(id),
  shift_date date NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  break_minutes integer,
  total_hours numeric,
  rate_per_hour numeric,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  service_category_id uuid REFERENCES public.service_categories(id),
  approved_by uuid REFERENCES public.staff(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK for billing_validations -> timesheets (now that timesheets exists)
ALTER TABLE public.billing_validations
  ADD CONSTRAINT billing_validations_timesheet_id_fkey
  FOREIGN KEY (timesheet_id) REFERENCES public.timesheets(id);

-- Add FK for invoice_line_items -> timesheets
ALTER TABLE public.invoice_line_items
  ADD CONSTRAINT invoice_line_items_timesheet_id_fkey
  FOREIGN KEY (timesheet_id) REFERENCES public.timesheets(id);

-- compliance_records
CREATE TABLE IF NOT EXISTS public.compliance_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  record_type text NOT NULL,
  record_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  issue_date date,
  expiry_date date,
  document_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- compliance_flags
CREATE TABLE IF NOT EXISTS public.compliance_flags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  description text NOT NULL,
  severity text DEFAULT 'medium',
  status text DEFAULT 'open',
  details jsonb,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- onboarding_tasks
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  task_name text NOT NULL,
  task_type text NOT NULL DEFAULT 'document',
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- policies
CREATE TABLE IF NOT EXISTS public.policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  policy_category text NOT NULL,
  content text,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  published_date date,
  requires_acknowledgement boolean DEFAULT false,
  document_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- policy_acknowledgements
CREATE TABLE IF NOT EXISTS public.policy_acknowledgements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id uuid NOT NULL REFERENCES public.policies(id),
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

-- shift_checkins
CREATE TABLE IF NOT EXISTS public.shift_checkins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id uuid REFERENCES public.staff(id),
  staff_name text NOT NULL,
  client_name text,
  shift_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'checked_in',
  check_in_time timestamptz,
  check_in_lat numeric,
  check_in_lng numeric,
  check_in_address text,
  check_out_time timestamptz,
  check_out_lat numeric,
  check_out_lng numeric,
  check_out_address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- training_records
CREATE TABLE IF NOT EXISTS public.training_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  training_name text NOT NULL,
  training_type text NOT NULL DEFAULT 'mandatory',
  provider text,
  completion_date date,
  expiry_date date,
  certificate_url text,
  status text NOT NULL DEFAULT 'not_started',
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- generate_invoice_number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  inv_number text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  inv_number := 'INV-' || LPAD(next_num::text, 5, '0');
  RETURN inv_number;
END;
$$;

-- get_user_staff_id
CREATE OR REPLACE FUNCTION public.get_user_staff_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  _staff_id uuid;
BEGIN
  SELECT staff_id INTO _staff_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  RETURN _staff_id;
END;
$$;

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (permissive for now - enable and add policies)
-- ============================================================

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users (adjust as needed)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'staff','clients','profiles','user_roles','audit_logs','notifications',
      'client_staff_assignments','client_funding','care_plans','service_agreements',
      'service_categories','case_notes','incidents','shifts','invoices',
      'invoice_line_items','billing_validations','timesheets','compliance_records',
      'compliance_flags','onboarding_tasks','policies','policy_acknowledgements',
      'shift_checkins','training_records','role_permissions','organisation_settings'
    ])
  LOOP
    EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- Also allow anon read for service_categories (public price lists)
CREATE POLICY "allow_anon_read_service_categories" ON public.service_categories FOR SELECT TO anon USING (true);

-- requests (client/staff requests)
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  requester_type text DEFAULT 'client',
  requester_id uuid REFERENCES public.clients(id),
  assigned_to uuid REFERENCES public.staff(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  notes text
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON public.requests;
CREATE POLICY allow_all ON public.requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
