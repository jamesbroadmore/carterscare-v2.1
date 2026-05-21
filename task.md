# CartersCare Audit & Fix Task

## Status: IN PROGRESS

## Missing Tables (404)
- `shifts` - referenced by Clients.tsx:130, ClientWorkspaceCard.tsx:79
- `notifications` - referenced by NotificationBell.tsx (4 queries)
- `requests` - NOT referenced in code (0 usages) - low priority

## Bugs to Fix
1. **ClientWorkspaceCard.tsx:79** - shifts query throws on error (no error guard) → fix to return []
2. **NotificationBell.tsx** - all queries 404 on notifications table → fix with error guard

## Tables Missing - SQL to Run in Supabase SQL Editor
### shifts
```sql
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
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON public.shifts;
CREATE POLICY allow_all ON public.shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### notifications
```sql
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
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON public.notifications;
CREATE POLICY allow_all ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### requests
```sql
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
```

## Seed Data Needed
All tables are empty. Need to generate via Supabase SQL editor.

## Schema Column Verification
- timesheets: shift_date, start_time, end_time, total_hours, status, notes, staff_id, client_id ✓
- case_notes: content, note_date, client_id, staff_id, category ✓  
- compliance_records: record_type, record_name, status, expiry_date, staff_id ✓
- incidents: incident_type, incident_date, severity, status, description, client_id ✓
- shifts: start_time, end_time, client_id, staff_id, service_type, status ✓

## Done
- [x] AuthContext fixed
- [x] DemoContext fixed
- [x] Identified missing tables: shifts, notifications, requests
- [x] Column schema verified against migration.sql
- [x] Confirmed Roster/MyRoster/ShiftCheckIn/WorkerCheckIn use timesheets/shift_checkins (not shifts)

## Next Steps
1. Fix ClientWorkspaceCard.tsx error handling for shifts
2. Fix NotificationBell.tsx error handling for notifications
3. Create SQL for missing tables (display to user for Supabase SQL editor)
4. Create seed data SQL
5. Push all fixes to GitHub
