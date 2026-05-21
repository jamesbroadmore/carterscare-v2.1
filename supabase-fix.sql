-- ============================================================
-- CartersCare: Missing Tables + RLS + Seed Data
-- Run this in the Supabase SQL Editor
-- Project: lwfqrtehouwfnwcikvhh
-- ============================================================

-- ============================================================
-- STEP 1: Create missing tables
-- ============================================================

-- shifts table (was missing from Supabase despite being in migration)
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

-- notifications table
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

-- requests table
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

-- ============================================================
-- STEP 2: Enable RLS on new tables
-- ============================================================

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON public.shifts;
CREATE POLICY allow_all ON public.shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON public.notifications;
CREATE POLICY allow_all ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON public.requests;
CREATE POLICY allow_all ON public.requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 3: Seed staff (8 support workers + 1 admin)
-- ============================================================

INSERT INTO public.staff (id, first_name, last_name, preferred_name, email, phone, date_of_birth, address, role, employment_type, status, start_date, qualifications, emergency_contact_name, emergency_contact_phone, notes)
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sarah', 'Mitchell', 'Sarah', 'sarah.mitchell@carterscare.com.au', '0412 345 678', '1990-03-15', '12 Karrinyup Rd, Karrinyup WA 6018', 'support_worker', 'casual', 'active', '2023-02-01', ARRAY['Certificate III in Individual Support', 'First Aid', 'NDIS Worker Screening'], 'David Mitchell', '0412 345 679', 'Experienced with autism support'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'James', 'Okafor', 'James', 'james.okafor@carterscare.com.au', '0423 456 789', '1988-07-22', '45 Scarborough Beach Rd, Scarborough WA 6019', 'support_worker', 'part_time', 'active', '2022-11-15', ARRAY['Certificate IV in Disability', 'First Aid', 'NDIS Worker Screening', 'Manual Handling'], 'Grace Okafor', '0423 456 790', 'Bilingual - English and Igbo'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Emma', 'Tran', 'Emma', 'emma.tran@carterscare.com.au', '0434 567 890', '1995-11-08', '78 Stirling Hwy, Claremont WA 6010', 'support_worker', 'casual', 'active', '2024-01-10', ARRAY['Certificate III in Individual Support', 'First Aid', 'NDIS Worker Screening'], 'Minh Tran', '0434 567 891', 'Studying nursing part-time'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Michael', 'Brown', 'Mike', 'michael.brown@carterscare.com.au', '0445 678 901', '1985-04-30', '99 Great Eastern Hwy, Midland WA 6056', 'support_worker', 'full_time', 'active', '2021-06-01', ARRAY['Certificate IV in Disability', 'First Aid', 'NDIS Worker Screening', 'Medication Administration', 'Complex Bowel Care'], 'Linda Brown', '0445 678 902', 'Senior worker - complex care'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Aisha', 'Patel', 'Aisha', 'aisha.patel@carterscare.com.au', '0456 789 012', '1992-09-18', '34 Canning Hwy, South Perth WA 6151', 'support_worker', 'part_time', 'active', '2023-08-14', ARRAY['Certificate III in Individual Support', 'First Aid', 'NDIS Worker Screening'], 'Raj Patel', '0456 789 013', NULL),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'Liam', 'Walsh', 'Liam', 'liam.walsh@carterscare.com.au', '0467 890 123', '1998-01-25', '56 Albany Hwy, Victoria Park WA 6100', 'support_worker', 'casual', 'active', '2024-03-04', ARRAY['Certificate III in Individual Support', 'First Aid', 'NDIS Worker Screening'], 'Fiona Walsh', '0467 890 124', 'New starter - on probation'),
  ('a1b2c3d4-0007-0007-0007-000000000007', 'Natalie', 'Russo', 'Nat', 'natalie.russo@carterscare.com.au', '0478 901 234', '1991-06-12', '23 Beaufort St, Mount Lawley WA 6050', 'support_worker', 'casual', 'active', '2023-05-20', ARRAY['Certificate IV in Disability', 'First Aid', 'NDIS Worker Screening', 'Positive Behaviour Support'], 'Marco Russo', '0478 901 235', 'PBS trained'),
  ('a1b2c3d4-0008-0008-0008-000000000008', 'Daniel', 'Kim', 'Dan', 'daniel.kim@carterscare.com.au', '0489 012 345', '1993-12-03', '67 Rokeby Rd, Subiaco WA 6008', 'support_worker', 'part_time', 'active', '2022-09-01', ARRAY['Certificate III in Individual Support', 'First Aid', 'NDIS Worker Screening', 'Manual Handling'], 'Jenny Kim', '0489 012 346', NULL),
  ('a1b2c3d4-0009-0009-0009-000000000009', 'Rachel', 'Carter', 'Rachel', 'rachel.carter@carterscare.com.au', '0400 111 222', '1982-05-14', '1 St Georges Tce, Perth WA 6000', 'admin', 'full_time', 'active', '2020-01-15', ARRAY['Bachelor of Business Administration', 'NDIS Worker Screening', 'Certificate IV in Disability'], 'Mark Carter', '0400 111 223', 'Director / Owner')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 4: Seed clients (8 NDIS participants)
-- ============================================================

INSERT INTO public.clients (id, first_name, last_name, preferred_name, email, phone, date_of_birth, address, suburb, state, postcode, funding_type, ndis_number, ndis_plan_start, ndis_plan_end, primary_disability, support_needs, plan_manager, support_coordinator, status, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, notes, gender, rate_weekday, rate_saturday, rate_sunday, rate_public_holiday)
VALUES
  ('b1c2d3e4-0001-0001-0001-000000000001', 'Thomas', 'Henderson', 'Tom', 'thomas.henderson@email.com', '0411 222 333', '1975-08-10', '14 Ocean Dr, Cottesloe WA 6011', 'Cottesloe', 'WA', '6011', 'NDIS', '430012345', '2024-07-01', '2025-06-30', 'Autism Spectrum Disorder', 'Community access, daily living skills, social participation', 'Plan Partners', 'Disability Services Perth', 'active', 'Margaret Henderson', '0411 222 334', 'Wife', 'Prefers structured routines. Sensitive to loud noises.', 'male', 59.81, 84.15, 104.91, 130.48),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'Priya', 'Sharma', 'Priya', 'priya.sharma@email.com', '0422 333 444', '1988-03-22', '28 King St, Fremantle WA 6160', 'Fremantle', 'WA', '6160', 'NDIS', '430023456', '2024-07-01', '2025-06-30', 'Cerebral Palsy', 'Personal care, mobility assistance, community access, transport', 'MyPlan Manager', 'Support Coordination WA', 'active', 'Vijay Sharma', '0422 333 445', 'Father', 'Uses power wheelchair. Vehicle must be wheelchair accessible.', 'female', 59.81, 84.15, 104.91, 130.48),
  ('b1c2d3e4-0003-0003-0003-000000000003', 'William', 'O''Brien', 'Will', NULL, '0433 444 555', '1962-11-30', '5 Leederville Pde, Leederville WA 6007', 'Leederville', 'WA', '6007', 'NDIS', '430034567', '2024-01-01', '2024-12-31', 'Acquired Brain Injury', 'Domestic assistance, meal preparation, medication support, social participation', 'Self-managed', NULL, 'active', 'Patricia O''Brien', '0433 444 556', 'Wife', 'History of stroke. Short-term memory difficulties.', 'male', 59.81, 84.15, 104.91, 130.48),
  ('b1c2d3e4-0004-0004-0004-000000000004', 'Sophie', 'Nguyen', 'Sophie', 'sophie.nguyen@email.com', '0444 555 666', '1998-06-15', '89 Beaufort St, Inglewood WA 6052', 'Inglewood', 'WA', '6052', 'NDIS', '430045678', '2025-01-01', '2025-12-31', 'Intellectual Disability', 'Daily living skills, community participation, social skills development', 'Plan Partners', 'Ability WA', 'active', 'Huong Nguyen', '0444 555 667', 'Mother', 'Works 2 days/week at Coles. Loves music and dancing.', 'female', 59.81, 84.15, 104.91, 130.48),
  ('b1c2d3e4-0005-0005-0005-000000000005', 'Robert', 'Thompson', 'Bob', NULL, '0455 666 777', '1958-02-14', '102 Stirling Hwy, North Fremantle WA 6159', 'North Fremantle', 'WA', '6159', 'NDIS', '430056789', '2024-07-01', '2025-06-30', 'Multiple Sclerosis', 'Personal care, domestic assistance, transport, exercise support', 'MyPlan Manager', NULL, 'active', 'Susan Thompson', '0455 666 778', 'Wife', 'Has good days and bad days - flexibility required.', 'male', 59.81, 84.15, 104.91, 130.48),
  ('b1c2d3e4-0006-0006-0006-000000000006', 'Grace', 'Wilson', 'Grace', 'grace.wilson@email.com', '0466 777 888', '1980-09-05', '17 Duncraig Rd, Duncraig WA 6023', 'Duncraig', 'WA', '6023', 'NDIS', '430067890', '2025-01-01', '2025-12-31', 'Spinal Cord Injury', 'Personal care, household tasks, community access', 'Plan Partners', 'Support Coordination WA', 'active', 'Peter Wilson', '0466 777 889', 'Husband', 'T6 complete SCI. Very independent attitude.', 'female', 59.81, 84.15, 104.91, 130.48),
  ('b1c2d3e4-0007-0007-0007-000000000007', 'Ethan', 'Collins', 'Ethan', NULL, '0477 888 999', '2001-04-18', '55 Balcatta Rd, Balcatta WA 6021', 'Balcatta', 'WA', '6021', 'NDIS', '430078901', '2024-07-01', '2025-06-30', 'Autism Spectrum Disorder', 'Supported independent living, life skills, community access', 'Self-managed', 'Spectrum Support WA', 'active', 'Helen Collins', '0477 889 000', 'Mother', 'Lives in SIL house with 2 other participants. Night support required occasionally.', 'male', 59.81, 84.15, 104.91, 130.48),
  ('b1c2d3e4-0008-0008-0008-000000000008', 'Maria', 'Santos', 'Maria', 'maria.santos@email.com', '0488 999 000', '1970-12-28', '63 Rockingham Rd, Spearwood WA 6163', 'Spearwood', 'WA', '6163', 'NDIS', '430089012', '2025-01-01', '2025-12-31', 'Psychiatric Disability', 'Community support, life skills, mental health support', 'MyPlan Manager', NULL, 'active', 'Carlos Santos', '0488 999 001', 'Brother', 'Anxiety triggers: crowds, unexpected changes. Prefers female workers.', 'female', 59.81, 84.15, 104.91, 130.48)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: Seed timesheets (recent shifts for this week and last week)
-- ============================================================

INSERT INTO public.timesheets (id, staff_id, client_id, shift_date, start_time, end_time, break_minutes, total_hours, rate_per_hour, status, notes)
VALUES
  -- Last week completed shifts
  (uuid_generate_v4(), 'a1b2c3d4-0001-0001-0001-000000000001', 'b1c2d3e4-0001-0001-0001-000000000001', CURRENT_DATE - 10, (CURRENT_DATE - 10)::timestamptz + interval '8 hours', (CURRENT_DATE - 10)::timestamptz + interval '12 hours', 0, 4, 59.81, 'approved', 'Community access - Cottesloe beach walk'),
  (uuid_generate_v4(), 'a1b2c3d4-0002-0002-0002-000000000002', 'b1c2d3e4-0002-0002-0002-000000000002', CURRENT_DATE - 10, (CURRENT_DATE - 10)::timestamptz + interval '9 hours', (CURRENT_DATE - 10)::timestamptz + interval '13 hours', 30, 3.5, 59.81, 'approved', 'Personal care and physio exercises'),
  (uuid_generate_v4(), 'a1b2c3d4-0004-0004-0004-000000000004', 'b1c2d3e4-0003-0003-0003-000000000003', CURRENT_DATE - 10, (CURRENT_DATE - 10)::timestamptz + interval '7 hours', (CURRENT_DATE - 10)::timestamptz + interval '13 hours', 30, 5.5, 59.81, 'approved', 'Morning care and domestic assistance'),
  (uuid_generate_v4(), 'a1b2c3d4-0005-0005-0005-000000000005', 'b1c2d3e4-0004-0004-0004-000000000004', CURRENT_DATE - 9, (CURRENT_DATE - 9)::timestamptz + interval '10 hours', (CURRENT_DATE - 9)::timestamptz + interval '14 hours', 0, 4, 59.81, 'approved', 'Life skills - cooking session'),
  (uuid_generate_v4(), 'a1b2c3d4-0007-0007-0007-000000000007', 'b1c2d3e4-0007-0007-0007-000000000007', CURRENT_DATE - 9, (CURRENT_DATE - 9)::timestamptz + interval '14 hours', (CURRENT_DATE - 9)::timestamptz + interval '20 hours', 0, 6, 59.81, 'approved', 'Afternoon/evening support at SIL'),
  (uuid_generate_v4(), 'a1b2c3d4-0003-0003-0003-000000000003', 'b1c2d3e4-0005-0005-0005-000000000005', CURRENT_DATE - 8, (CURRENT_DATE - 8)::timestamptz + interval '8 hours', (CURRENT_DATE - 8)::timestamptz + interval '12 hours', 0, 4, 59.81, 'approved', 'Exercise support and transport'),
  (uuid_generate_v4(), 'a1b2c3d4-0006-0006-0006-000000000006', 'b1c2d3e4-0006-0006-0006-000000000006', CURRENT_DATE - 8, (CURRENT_DATE - 8)::timestamptz + interval '7 hours', (CURRENT_DATE - 8)::timestamptz + interval '11 hours', 0, 4, 59.81, 'approved', 'Morning personal care'),
  (uuid_generate_v4(), 'a1b2c3d4-0008-0008-0008-000000000008', 'b1c2d3e4-0008-0008-0008-000000000008', CURRENT_DATE - 7, (CURRENT_DATE - 7)::timestamptz + interval '11 hours', (CURRENT_DATE - 7)::timestamptz + interval '15 hours', 0, 4, 59.81, 'approved', 'Community participation - shopping centre'),
  -- Saturday (higher rate)
  (uuid_generate_v4(), 'a1b2c3d4-0001-0001-0001-000000000001', 'b1c2d3e4-0002-0002-0002-000000000002', CURRENT_DATE - 6, (CURRENT_DATE - 6)::timestamptz + interval '9 hours', (CURRENT_DATE - 6)::timestamptz + interval '13 hours', 0, 4, 84.15, 'approved', 'Saturday community access'),
  -- This week
  (uuid_generate_v4(), 'a1b2c3d4-0001-0001-0001-000000000001', 'b1c2d3e4-0001-0001-0001-000000000001', CURRENT_DATE - 3, (CURRENT_DATE - 3)::timestamptz + interval '8 hours', (CURRENT_DATE - 3)::timestamptz + interval '12 hours', 0, 4, 59.81, 'pending', 'Community access'),
  (uuid_generate_v4(), 'a1b2c3d4-0002-0002-0002-000000000002', 'b1c2d3e4-0002-0002-0002-000000000002', CURRENT_DATE - 3, (CURRENT_DATE - 3)::timestamptz + interval '9 hours', (CURRENT_DATE - 3)::timestamptz + interval '13 hours', 30, 3.5, 59.81, 'pending', 'Personal care'),
  (uuid_generate_v4(), 'a1b2c3d4-0004-0004-0004-000000000004', 'b1c2d3e4-0003-0003-0003-000000000003', CURRENT_DATE - 2, (CURRENT_DATE - 2)::timestamptz + interval '7 hours', (CURRENT_DATE - 2)::timestamptz + interval '13 hours', 30, 5.5, 59.81, 'pending', 'Morning care'),
  (uuid_generate_v4(), 'a1b2c3d4-0005-0005-0005-000000000005', 'b1c2d3e4-0004-0004-0004-000000000004', CURRENT_DATE - 1, (CURRENT_DATE - 1)::timestamptz + interval '10 hours', (CURRENT_DATE - 1)::timestamptz + interval '14 hours', 0, 4, 59.81, 'pending', 'Life skills session'),
  (uuid_generate_v4(), 'a1b2c3d4-0003-0003-0003-000000000003', 'b1c2d3e4-0005-0005-0005-000000000005', CURRENT_DATE, CURRENT_DATE::timestamptz + interval '8 hours', CURRENT_DATE::timestamptz + interval '12 hours', 0, 4, 59.81, 'pending', 'Exercise and community'),
  (uuid_generate_v4(), 'a1b2c3d4-0007-0007-0007-000000000007', 'b1c2d3e4-0007-0007-0007-000000000007', CURRENT_DATE, CURRENT_DATE::timestamptz + interval '14 hours', CURRENT_DATE::timestamptz + interval '20 hours', 0, 6, 59.81, 'pending', 'Evening SIL support'),
  -- Upcoming
  (uuid_generate_v4(), 'a1b2c3d4-0006-0006-0006-000000000006', 'b1c2d3e4-0006-0006-0006-000000000006', CURRENT_DATE + 1, (CURRENT_DATE + 1)::timestamptz + interval '7 hours', (CURRENT_DATE + 1)::timestamptz + interval '11 hours', 0, 4, 59.81, 'pending', 'Personal care'),
  (uuid_generate_v4(), 'a1b2c3d4-0008-0008-0008-000000000008', 'b1c2d3e4-0008-0008-0008-000000000008', CURRENT_DATE + 1, (CURRENT_DATE + 1)::timestamptz + interval '11 hours', (CURRENT_DATE + 1)::timestamptz + interval '15 hours', 0, 4, 59.81, 'pending', 'Community support'),
  (uuid_generate_v4(), 'a1b2c3d4-0001-0001-0001-000000000001', 'b1c2d3e4-0001-0001-0001-000000000001', CURRENT_DATE + 2, (CURRENT_DATE + 2)::timestamptz + interval '8 hours', (CURRENT_DATE + 2)::timestamptz + interval '12 hours', 0, 4, 59.81, 'pending', 'Community access'),
  (uuid_generate_v4(), 'a1b2c3d4-0002-0002-0002-000000000002', 'b1c2d3e4-0002-0002-0002-000000000002', CURRENT_DATE + 3, (CURRENT_DATE + 3)::timestamptz + interval '9 hours', (CURRENT_DATE + 3)::timestamptz + interval '14 hours', 30, 4.5, 59.81, 'pending', 'Personal care and physio')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 6: Seed shifts (for client schedule display)
-- ============================================================

INSERT INTO public.shifts (client_id, staff_id, start_time, end_time, service_type, status, notes)
VALUES
  ('b1c2d3e4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', CURRENT_DATE::timestamptz + interval '8 hours', CURRENT_DATE::timestamptz + interval '12 hours', 'Community Access', 'scheduled', NULL),
  ('b1c2d3e4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', (CURRENT_DATE + 2)::timestamptz + interval '8 hours', (CURRENT_DATE + 2)::timestamptz + interval '12 hours', 'Community Access', 'scheduled', NULL),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', CURRENT_DATE::timestamptz + interval '9 hours', CURRENT_DATE::timestamptz + interval '13 hours', 'Personal Care', 'scheduled', NULL),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', (CURRENT_DATE + 3)::timestamptz + interval '9 hours', (CURRENT_DATE + 3)::timestamptz + interval '14 hours', 'Personal Care', 'scheduled', NULL),
  ('b1c2d3e4-0003-0003-0003-000000000003', 'a1b2c3d4-0004-0004-0004-000000000004', (CURRENT_DATE + 1)::timestamptz + interval '7 hours', (CURRENT_DATE + 1)::timestamptz + interval '13 hours', 'Domestic Assistance', 'scheduled', NULL),
  ('b1c2d3e4-0004-0004-0004-000000000004', 'a1b2c3d4-0005-0005-0005-000000000005', (CURRENT_DATE + 1)::timestamptz + interval '10 hours', (CURRENT_DATE + 1)::timestamptz + interval '14 hours', 'Life Skills', 'scheduled', NULL),
  ('b1c2d3e4-0005-0005-0005-000000000005', 'a1b2c3d4-0003-0003-0003-000000000003', (CURRENT_DATE + 2)::timestamptz + interval '8 hours', (CURRENT_DATE + 2)::timestamptz + interval '12 hours', 'Exercise Support', 'scheduled', NULL),
  ('b1c2d3e4-0007-0007-0007-000000000007', 'a1b2c3d4-0007-0007-0007-000000000007', CURRENT_DATE::timestamptz + interval '14 hours', CURRENT_DATE::timestamptz + interval '20 hours', 'SIL Support', 'scheduled', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 7: Seed case notes
-- ============================================================

INSERT INTO public.case_notes (client_id, staff_id, content, category, note_date, is_confidential)
VALUES
  ('b1c2d3e4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'Tom had a great session today at Cottesloe. We walked along the beach for 45 minutes, then visited the cafe for lunch. He was calm and engaged throughout. No incidents to report. He mentioned he''s looking forward to the market visit next week.', 'Progress Note', CURRENT_DATE - 10, false),
  ('b1c2d3e4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'Tom was unsettled today due to roadworks near his home causing loud noise. We adjusted the plan and stayed indoors for the first hour. Once calmer, we completed the cooking activity (scrambled eggs). Goal: continue building tolerance to unexpected sensory inputs.', 'Incident Note', CURRENT_DATE - 5, false),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Priya completed all personal care tasks with minimal assistance today. Completed physio exercises: 3 sets of arm raises, shoulder rotations. She reported pain at 4/10 in right shoulder. Notified support coordinator. Otherwise in good spirits.', 'Progress Note', CURRENT_DATE - 9, false),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001', 'Saturday community access - Fremantle markets. Priya navigated independently in wheelchair with minimal assistance around crowded areas. Purchased handmade jewellery. Great session. She was very happy with the outing.', 'Progress Note', CURRENT_DATE - 6, false),
  ('b1c2d3e4-0003-0003-0003-000000000003', 'a1b2c3d4-0004-0004-0004-000000000004', 'Will completed morning routine with assistance. Medication administered as prescribed (checked against webster pack). Prepared breakfast together - he managed toast independently. Memory exercises: 15 mins of card matching game. Will remembered all 3 words from earlier session.', 'Progress Note', CURRENT_DATE - 8, false),
  ('b1c2d3e4-0004-0004-0004-000000000004', 'a1b2c3d4-0005-0005-0005-000000000005', 'Sophie was excited about her day at Coles yesterday. We focused on cooking skills - she prepared pasta with bolognese sauce with minimal prompting. She is building confidence in the kitchen. Discussed her upcoming birthday plans.', 'Progress Note', CURRENT_DATE - 7, false),
  ('b1c2d3e4-0005-0005-0005-000000000005', 'a1b2c3d4-0003-0003-0003-000000000003', 'Bob had a difficult day - fatigue higher than usual. We cancelled the planned walk and instead did gentle stretching at home. He remains positive in attitude. His wife Susan mentioned he slept poorly. Will monitor and adjust next session accordingly.', 'Progress Note', CURRENT_DATE - 6, false),
  ('b1c2d3e4-0006-0006-0006-000000000006', 'a1b2c3d4-0006-0006-0006-000000000006', 'Grace''s morning routine completed efficiently. She is very organised and knows exactly what she needs. Assisted with shower and dressing. Prepared her own breakfast while I completed some household tasks. She had a phone call with her sister during the visit.', 'Progress Note', CURRENT_DATE - 4, false),
  ('b1c2d3e4-0007-0007-0007-000000000007', 'a1b2c3d4-0007-0007-0007-000000000007', 'Ethan had a settled evening in the SIL house. Cooked dinner with housemates (spaghetti bolognese). Watched a documentary about space (his current interest). Completed bedtime routine independently. No behaviours of concern.', 'Progress Note', CURRENT_DATE - 3, false),
  ('b1c2d3e4-0008-0008-0008-000000000008', 'a1b2c3d4-0008-0008-0008-000000000008', 'Maria was anxious at start of session (had a difficult morning). We sat quietly for 15 mins with herbal tea before starting any activities. She then felt comfortable enough for a short walk around the local park. She is making good progress with managing anxiety triggers.', 'Progress Note', CURRENT_DATE - 2, false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 8: Seed incidents
-- ============================================================

INSERT INTO public.incidents (client_id, incident_type, incident_date, severity, status, description, location, immediate_action, injury_occurred, medical_attention_required, follow_up_required, follow_up_notes, reported_by)
VALUES
  ('b1c2d3e4-0001-0001-0001-000000000001', 'Behavioural Incident', CURRENT_DATE - 15, 'low', 'closed', 'Tom became distressed when routine was disrupted by a delayed bus. He raised his voice and refused to board the bus when it arrived. Support worker used de-escalation strategies. Tom calmed within 10 minutes and agreed to take next bus.', 'Cottesloe Bus Stop', 'De-escalation, offered alternative transport via Uber. Notified family.', false, false, false, 'Tom has since been more settled. Added bus delays to his visual schedule.', 'a1b2c3d4-0001-0001-0001-000000000001'),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'Near Miss', CURRENT_DATE - 8, 'medium', 'investigating', 'Priya''s wheelchair nearly tipped on uneven footpath near the Fremantle markets. Support worker prevented the incident by grabbing the handles in time. No injury occurred but Priya was shaken.', 'Fremantle Markets Surrounds', 'Ensured Priya was safe and calm. Reported uneven footpath to council.', false, false, true, 'Council has been notified. Will avoid that route until repaired.', 'a1b2c3d4-0001-0001-0001-000000000001'),
  ('b1c2d3e4-0005-0005-0005-000000000005', 'Medical', CURRENT_DATE - 20, 'high', 'closed', 'Bob experienced significant fatigue and dizziness during community walk. He requested to sit down immediately. Support worker called Susan who arranged transport home. GP was contacted.', 'Stirling Hwy Footpath, North Fremantle', 'Assisted Bob to sit safely on nearby bench. Called family. Monitored until family arrived.', false, true, false, 'GP visit confirmed MS exacerbation. Activity levels have been adjusted in support plan.', 'a1b2c3d4-0003-0003-0003-000000000003')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 9: Seed compliance records
-- ============================================================

INSERT INTO public.compliance_records (staff_id, record_type, record_name, status, issue_date, expiry_date, notes)
VALUES
  -- Sarah Mitchell
  ('a1b2c3d4-0001-0001-0001-000000000001', 'police_check', 'National Police Check', 'current', '2023-01-15', '2025-01-15', NULL),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2023-02-01', '2028-02-01', 'WA Screening Clearance'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'first_aid', 'First Aid Certificate', 'current', '2024-03-10', '2026-03-10', 'HLTAID011'),
  -- James Okafor
  ('a1b2c3d4-0002-0002-0002-000000000002', 'police_check', 'National Police Check', 'current', '2022-10-01', '2024-10-01', NULL),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2022-11-15', '2027-11-15', NULL),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'first_aid', 'First Aid Certificate', 'expiring_soon', '2023-03-05', '2025-03-05', 'Renewal due soon'),
  -- Emma Tran
  ('a1b2c3d4-0003-0003-0003-000000000003', 'police_check', 'National Police Check', 'current', '2024-01-10', '2026-01-10', NULL),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2024-01-10', '2029-01-10', NULL),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'first_aid', 'First Aid Certificate', 'current', '2024-01-15', '2026-01-15', NULL),
  -- Michael Brown
  ('a1b2c3d4-0004-0004-0004-000000000004', 'police_check', 'National Police Check', 'current', '2023-05-20', '2025-05-20', NULL),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2021-06-01', '2026-06-01', NULL),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'first_aid', 'First Aid Certificate', 'current', '2024-06-01', '2026-06-01', NULL),
  -- Aisha Patel
  ('a1b2c3d4-0005-0005-0005-000000000005', 'police_check', 'National Police Check', 'current', '2023-08-14', '2025-08-14', NULL),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2023-08-14', '2028-08-14', NULL),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'first_aid', 'First Aid Certificate', 'current', '2023-09-01', '2025-09-01', NULL),
  -- Liam Walsh  
  ('a1b2c3d4-0006-0006-0006-000000000006', 'police_check', 'National Police Check', 'current', '2024-03-04', '2026-03-04', NULL),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2024-03-04', '2029-03-04', NULL),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'first_aid', 'First Aid Certificate', 'pending', NULL, NULL, 'Enrolled in course starting next month'),
  -- Natalie Russo
  ('a1b2c3d4-0007-0007-0007-000000000007', 'police_check', 'National Police Check', 'expired', '2022-05-20', '2024-05-20', 'URGENT - renewal required'),
  ('a1b2c3d4-0007-0007-0007-000000000007', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2023-05-20', '2028-05-20', NULL),
  ('a1b2c3d4-0007-0007-0007-000000000007', 'first_aid', 'First Aid Certificate', 'current', '2024-02-14', '2026-02-14', NULL),
  -- Daniel Kim
  ('a1b2c3d4-0008-0008-0008-000000000008', 'police_check', 'National Police Check', 'current', '2022-09-01', '2024-09-01', NULL),
  ('a1b2c3d4-0008-0008-0008-000000000008', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2022-09-01', '2027-09-01', NULL),
  ('a1b2c3d4-0008-0008-0008-000000000008', 'first_aid', 'First Aid Certificate', 'expiring_soon', '2023-09-01', '2025-09-01', 'Renewal due in 4 months'),
  -- Rachel Carter (admin)
  ('a1b2c3d4-0009-0009-0009-000000000009', 'police_check', 'National Police Check', 'current', '2023-01-15', '2025-01-15', NULL),
  ('a1b2c3d4-0009-0009-0009-000000000009', 'ndis_screening', 'NDIS Worker Screening Check', 'current', '2020-01-15', '2025-01-15', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 10: Seed client_staff_assignments
-- ============================================================

INSERT INTO public.client_staff_assignments (client_id, staff_id)
VALUES
  ('b1c2d3e4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001'),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002'),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001'),
  ('b1c2d3e4-0003-0003-0003-000000000003', 'a1b2c3d4-0004-0004-0004-000000000004'),
  ('b1c2d3e4-0004-0004-0004-000000000004', 'a1b2c3d4-0005-0005-0005-000000000005'),
  ('b1c2d3e4-0005-0005-0005-000000000005', 'a1b2c3d4-0003-0003-0003-000000000003'),
  ('b1c2d3e4-0006-0006-0006-000000000006', 'a1b2c3d4-0006-0006-0006-000000000006'),
  ('b1c2d3e4-0007-0007-0007-000000000007', 'a1b2c3d4-0007-0007-0007-000000000007'),
  ('b1c2d3e4-0008-0008-0008-000000000008', 'a1b2c3d4-0008-0008-0008-000000000008')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 11: Seed shift_checkins
-- ============================================================

INSERT INTO public.shift_checkins (staff_id, staff_name, client_name, shift_date, status, check_in_time, check_in_lat, check_in_lng, check_in_address, check_out_time, check_out_lat, check_out_lng, check_out_address, notes)
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sarah Mitchell', 'Tom Henderson', CURRENT_DATE - 10, 'checked_out', (CURRENT_DATE - 10)::timestamptz + interval '8 hours 2 minutes', -31.9939, 115.7553, '14 Ocean Dr, Cottesloe WA 6011', (CURRENT_DATE - 10)::timestamptz + interval '12 hours 5 minutes', -31.9939, 115.7553, '14 Ocean Dr, Cottesloe WA 6011', 'Great session at beach'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'James Okafor', 'Priya Sharma', CURRENT_DATE - 10, 'checked_out', (CURRENT_DATE - 10)::timestamptz + interval '9 hours 3 minutes', -32.0569, 115.7487, '28 King St, Fremantle WA 6160', (CURRENT_DATE - 10)::timestamptz + interval '12 hours 35 minutes', -32.0569, 115.7487, '28 King St, Fremantle WA 6160', 'Personal care completed'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Michael Brown', 'William O''Brien', CURRENT_DATE - 9, 'checked_out', (CURRENT_DATE - 9)::timestamptz + interval '7 hours 1 minute', -31.9384, 115.8521, '5 Leederville Pde, Leederville WA 6007', (CURRENT_DATE - 9)::timestamptz + interval '12 hours 30 minutes', -31.9384, 115.8521, '5 Leederville Pde, Leederville WA 6007', NULL),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sarah Mitchell', 'Tom Henderson', CURRENT_DATE - 3, 'checked_out', (CURRENT_DATE - 3)::timestamptz + interval '8 hours 0 minutes', -31.9939, 115.7553, '14 Ocean Dr, Cottesloe WA 6011', (CURRENT_DATE - 3)::timestamptz + interval '12 hours 3 minutes', -31.9939, 115.7553, '14 Ocean Dr, Cottesloe WA 6011', NULL),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'James Okafor', 'Priya Sharma', CURRENT_DATE - 3, 'checked_out', (CURRENT_DATE - 3)::timestamptz + interval '9 hours', -32.0569, 115.7487, '28 King St, Fremantle WA 6160', (CURRENT_DATE - 3)::timestamptz + interval '12 hours 30 minutes', -32.0569, 115.7487, '28 King St, Fremantle WA 6160', NULL),
  -- Today's checkins
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Emma Tran', 'Robert Thompson', CURRENT_DATE, 'checked_in', CURRENT_DATE::timestamptz + interval '8 hours 1 minute', -32.0453, 115.7571, '102 Stirling Hwy, North Fremantle WA 6159', NULL, NULL, NULL, NULL, 'Just checked in')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 12: Seed invoices
-- ============================================================

INSERT INTO public.invoices (id, invoice_number, staff_id, invoice_date, due_date, status, subtotal, gst, total, notes, abn)
VALUES
  ('c1d2e3f4-0001-0001-0001-000000000001', 'INV-2025-0001', 'a1b2c3d4-0001-0001-0001-000000000001', CURRENT_DATE - 14, CURRENT_DATE - 7, 'paid', 717.72, 0, 717.72, 'Weekly invoice - support worker services', '12 345 678 901'),
  ('c1d2e3f4-0002-0002-0002-000000000002', 'INV-2025-0002', 'a1b2c3d4-0002-0002-0002-000000000002', CURRENT_DATE - 14, CURRENT_DATE - 7, 'paid', 508.39, 0, 508.39, 'Weekly invoice', '23 456 789 012'),
  ('c1d2e3f4-0003-0003-0003-000000000003', 'INV-2025-0003', 'a1b2c3d4-0004-0004-0004-000000000004', CURRENT_DATE - 14, CURRENT_DATE - 7, 'approved', 986.87, 0, 986.87, 'Complex care shifts', '45 678 901 234'),
  ('c1d2e3f4-0004-0004-0004-000000000004', 'INV-2025-0004', 'a1b2c3d4-0001-0001-0001-000000000001', CURRENT_DATE - 7, CURRENT_DATE, 'submitted', 478.48, 0, 478.48, 'Current week invoice', '12 345 678 901'),
  ('c1d2e3f4-0005-0005-0005-000000000005', 'INV-2025-0005', 'a1b2c3d4-0002-0002-0002-000000000002', CURRENT_DATE - 7, CURRENT_DATE, 'draft', 359.49, 0, 359.49, 'Draft - pending review', '23 456 789 012')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 13: Seed invoice line items
-- ============================================================

INSERT INTO public.invoice_line_items (invoice_id, client_id, description, hours, rate, amount, service_date, funding_program)
VALUES
  ('c1d2e3f4-0001-0001-0001-000000000001', 'b1c2d3e4-0001-0001-0001-000000000001', 'Community Access - Tom Henderson', 4, 59.81, 239.24, CURRENT_DATE - 16, 'NDIS Core Supports'),
  ('c1d2e3f4-0001-0001-0001-000000000001', 'b1c2d3e4-0002-0002-0002-000000000002', 'Personal Care - Priya Sharma (Saturday)', 4, 84.15, 336.60, CURRENT_DATE - 15, 'NDIS Core Supports'),
  ('c1d2e3f4-0001-0001-0001-000000000001', 'b1c2d3e4-0001-0001-0001-000000000001', 'Community Access - Tom Henderson', 2.36, 59.81, 141.15, CURRENT_DATE - 13, 'NDIS Core Supports'),
  ('c1d2e3f4-0002-0002-0002-000000000002', 'b1c2d3e4-0002-0002-0002-000000000002', 'Personal Care - Priya Sharma', 3.5, 59.81, 209.34, CURRENT_DATE - 16, 'NDIS Core Supports'),
  ('c1d2e3f4-0002-0002-0002-000000000002', 'b1c2d3e4-0002-0002-0002-000000000002', 'Personal Care - Priya Sharma', 5, 59.81, 299.05, CURRENT_DATE - 11, 'NDIS Core Supports'),
  ('c1d2e3f4-0003-0003-0003-000000000003', 'b1c2d3e4-0003-0003-0003-000000000003', 'Domestic Assistance & Personal Care - William O''Brien', 5.5, 59.81, 328.96, CURRENT_DATE - 16, 'NDIS Core Supports'),
  ('c1d2e3f4-0003-0003-0003-000000000003', 'b1c2d3e4-0003-0003-0003-000000000003', 'Domestic Assistance & Personal Care - William O''Brien', 5.5, 59.81, 328.96, CURRENT_DATE - 14, 'NDIS Core Supports'),
  ('c1d2e3f4-0003-0003-0003-000000000003', 'b1c2d3e4-0003-0003-0003-000000000003', 'Morning Care - William O''Brien', 5.5, 59.81, 328.96, CURRENT_DATE - 10, 'NDIS Core Supports'),
  ('c1d2e3f4-0004-0004-0004-000000000004', 'b1c2d3e4-0001-0001-0001-000000000001', 'Community Access - Tom Henderson', 4, 59.81, 239.24, CURRENT_DATE - 5, 'NDIS Core Supports'),
  ('c1d2e3f4-0004-0004-0004-000000000004', 'b1c2d3e4-0002-0002-0002-000000000002', 'Personal Care - Priya Sharma', 4, 59.81, 239.24, CURRENT_DATE - 5, 'NDIS Core Supports'),
  ('c1d2e3f4-0005-0005-0005-000000000005', 'b1c2d3e4-0002-0002-0002-000000000002', 'Personal Care - Priya Sharma', 3.5, 59.81, 209.34, CURRENT_DATE - 3, 'NDIS Core Supports'),
  ('c1d2e3f4-0005-0005-0005-000000000005', 'b1c2d3e4-0002-0002-0002-000000000002', 'Personal Care - Priya Sharma', 2.5, 59.81, 149.53, CURRENT_DATE - 1, 'NDIS Core Supports')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 14: Seed organisation settings
-- ============================================================

INSERT INTO public.organisation_settings (key, value)
VALUES
  ('org_name', 'CartersCare'),
  ('org_abn', '12 345 678 900'),
  ('org_email', 'admin@carterscare.com.au'),
  ('org_phone', '08 9000 0000'),
  ('org_address', 'Suite 5, 100 St Georges Tce, Perth WA 6000'),
  ('org_registration', 'NDIS Provider Registration: 4-XXXXXX'),
  ('timezone', 'Australia/Perth'),
  ('invoice_prefix', 'INV-2025-'),
  ('default_rate_weekday', '59.81'),
  ('default_rate_saturday', '84.15'),
  ('default_rate_sunday', '104.91'),
  ('default_rate_public_holiday', '130.48')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- DONE - Verify row counts
-- ============================================================
SELECT 'staff' as table_name, COUNT(*) as rows FROM public.staff
UNION ALL SELECT 'clients', COUNT(*) FROM public.clients
UNION ALL SELECT 'timesheets', COUNT(*) FROM public.timesheets
UNION ALL SELECT 'shifts', COUNT(*) FROM public.shifts
UNION ALL SELECT 'case_notes', COUNT(*) FROM public.case_notes
UNION ALL SELECT 'incidents', COUNT(*) FROM public.incidents
UNION ALL SELECT 'compliance_records', COUNT(*) FROM public.compliance_records
UNION ALL SELECT 'shift_checkins', COUNT(*) FROM public.shift_checkins
UNION ALL SELECT 'invoices', COUNT(*) FROM public.invoices
UNION ALL SELECT 'invoice_line_items', COUNT(*) FROM public.invoice_line_items
UNION ALL SELECT 'client_staff_assignments', COUNT(*) FROM public.client_staff_assignments
UNION ALL SELECT 'organisation_settings', COUNT(*) FROM public.organisation_settings
ORDER BY table_name;
