# Audit Results — Bugs to Fix

## BUG 1: `requests` table missing ❌
- Requests.tsx queries `from("requests")` with FK joins
- Table doesn't exist in migration.sql
- FIX: Create the table in DB, or make the page gracefully handle missing table (already silently catches error)
- DECISION: Create the table to make Requests page functional

## BUG 2: StaffTraining.tsx uses `document_type` instead of `record_type` ❌
- Line 75-76: `.select("staff_id, document_type, status, expiry_date")`  
- compliance_records schema has `record_type`, NOT `document_type`
- Also uses `m.name` but modules have `m.id`, not `m.name`
- FIX: Change to `record_type` and `m.id`

## BUG 3: EmptyState icon prop mismatch ❌
- StaffHR.tsx, MyTimesheets.tsx, ClientRisk.tsx, ClientCarePlans.tsx pass `icon={<JSXElement>}` 
- But ui-kit EmptyState expects `icon?: LucideIcon` (component type, rendered as `<Icon className=.../>`)
- This will crash at runtime
- FIX: Change to `icon={Users}` etc (component ref), or update EmptyState to accept both

## BUG 4: StaffHR writes `status: "valid"` but rest of app uses `status: "current"` ❌
- DocumentUploadDialog inserts with `status: "valid"` (line 427)
- Other pages (Compliance, MyCompliance, Reports) check for `status === "current"` 
- StaffHR reads checks for `status === "valid"` inconsistently
- FIX: Standardize on "current" everywhere OR make StaffHR check both

## ALREADY HANDLED (not bugs):
- ClientPortal uses DEMO_DATA — expected, demo-only page ✅
- Requests.tsx silently catches missing table error — OK but table should exist ✅
- StaffOnboardingWizard queries staff.user_id — column exists ✅ 
- Onboarding queries policies, policy_acknowledgements — tables exist ✅
- training_records table exists ✅
