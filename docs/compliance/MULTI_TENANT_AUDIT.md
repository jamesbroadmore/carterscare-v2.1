# Multi-Tenant Audit Report

**Carters Care Platform**  
**Date:** May 2025  
**Status:** Single-Tenant Architecture

---

## Current Architecture Assessment

### Finding: Single-Tenant Design

The current database schema operates as a **single-tenant** system. There is no `tenant_id`, `org_id`, or `organization_id` column in any of the core tables.

### Tables Audited

| Table | Has Tenant ID | Risk Level | Notes |
|-------|---------------|------------|-------|
| audit_logs | ❌ No | Medium | Logs from all users visible |
| billing_validations | ❌ No | Low | Linked to invoices |
| care_plans | ❌ No | **High** | Client care data exposed |
| case_notes | ❌ No | **High** | Sensitive client notes |
| client_funding | ❌ No | **High** | Financial data |
| client_staff_assignments | ❌ No | Medium | Staff-client relationships |
| clients | ❌ No | **High** | All client PII |
| compliance_flags | ❌ No | Medium | Staff compliance |
| compliance_records | ❌ No | Medium | Certification data |
| incidents | ❌ No | **High** | Incident reports |
| invoice_line_items | ❌ No | Medium | Financial details |
| invoices | ❌ No | **High** | Financial records |
| notifications | ❌ No | Low | User notifications |
| onboarding_tasks | ❌ No | Low | Staff onboarding |
| organisation_settings | ❌ No | Low | Global settings |
| policies | ❌ No | Low | Company policies |
| policy_acknowledgements | ❌ No | Low | Staff acknowledgements |
| profiles | ❌ No | Medium | User profiles |
| role_permissions | ❌ No | Low | RBAC permissions |
| service_agreements | ❌ No | Medium | Client agreements |
| service_categories | ❌ No | Low | Service types |
| shift_checkins | ❌ No | Medium | EVV data |
| shifts | ❌ No | Medium | Scheduling |
| staff | ❌ No | **High** | Staff PII |
| timesheets | ❌ No | **High** | Payroll data |
| training_records | ❌ No | Low | Training completion |
| user_roles | ❌ No | Medium | User permissions |

---

## Risk Assessment

### Current State Risks

1. **Data Isolation**: If multiple organizations were added to this instance, all data would be visible to all users with appropriate roles.

2. **Compliance Risk**: NDIS and Privacy Act requirements mandate data segregation between service providers.

3. **Scale Limitation**: Cannot onboard multiple care organizations to the same instance.

### Recommendation

For a **single organization deployment** (current use case), the architecture is acceptable. Row Level Security (RLS) based on `user_id` provides user-level access control.

For **multi-organization SaaS**, implement tenant isolation before onboarding additional organizations.

---

## Implementation Plan (If Multi-Tenancy Required)

### Phase 1: Schema Updates

```sql
-- Step 1: Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Add org_id to core tables
ALTER TABLE public.clients ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.staff ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.incidents ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.invoices ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.timesheets ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.shifts ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.case_notes ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.care_plans ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.compliance_records ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Step 3: Add org_id to user profiles
ALTER TABLE public.profiles ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE public.user_roles ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Step 4: Create indexes
CREATE INDEX idx_clients_org_id ON public.clients(org_id);
CREATE INDEX idx_staff_org_id ON public.staff(org_id);
CREATE INDEX idx_incidents_org_id ON public.incidents(org_id);
CREATE INDEX idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX idx_timesheets_org_id ON public.timesheets(org_id);
```

### Phase 2: RLS Policies

```sql
-- Function to get user's organization
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Example: Clients table RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view clients in their org"
  ON public.clients FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can only insert clients in their org"
  ON public.clients FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can only update clients in their org"
  ON public.clients FOR UPDATE
  USING (org_id = get_user_org_id());

-- Repeat for all tenant-scoped tables...
```

### Phase 3: Frontend Updates

```typescript
// Add org_id to all mutations
const createClient = async (clientData: ClientInput) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .single();
    
  return supabase.from('clients').insert({
    ...clientData,
    org_id: profile.org_id  // Always include org_id
  });
};
```

### Phase 4: Data Migration

```sql
-- Create default organization
INSERT INTO organizations (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Carter''s Care', 'carters-care');

-- Migrate existing data
UPDATE clients SET org_id = '00000000-0000-0000-0000-000000000001';
UPDATE staff SET org_id = '00000000-0000-0000-0000-000000000001';
-- ... repeat for all tables
```

---

## Current Read Path Analysis

### Tables Without Proper Scoping

The following queries fetch **all records** without tenant filtering:

| File | Query | Risk |
|------|-------|------|
| `Clients.tsx` | `supabase.from("clients").select("*")` | High - All clients visible |
| `Staff.tsx` | `supabase.from("staff").select("*")` | High - All staff visible |
| `Incidents.tsx` | `supabase.from("incidents").select("*")` | High - All incidents visible |
| `Timesheets.tsx` | `supabase.from("timesheets").select("*")` | High - All timesheets visible |
| `Invoices.tsx` | `supabase.from("invoices").select("*")` | High - All invoices visible |

### Mitigation for Single-Tenant

Since this is currently single-tenant, these queries are acceptable. Supabase RLS policies based on `user_id` and role provide access control.

---

## Recommendations

### For Current Single-Tenant Use

1. ✅ **No immediate action required**
2. ✅ Current RLS policies provide user-level security
3. ✅ Admin/worker role separation is functional

### For Future Multi-Tenant Use

1. ⚠️ Implement `org_id` columns before onboarding second organization
2. ⚠️ Update all frontend queries to include org scoping
3. ⚠️ Add RLS policies for tenant isolation
4. ⚠️ Audit all API endpoints for tenant context

---

## Conclusion

**Current Status:** Single-tenant, acceptable for single organization deployment.

**Multi-tenant Ready:** No - requires schema changes and RLS updates before SaaS scaling.

**Estimated Effort for Multi-Tenancy:** 2-3 weeks development + testing

---

*Audit completed: May 2025*
