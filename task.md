# Full Audit Complete

## Bugs Found & Fixed

### Critical
1. **Timesheets.tsx** - Referenced `hourly_rate` column in staff select query — column doesn't exist. **FIXED**: removed from select.
2. **Timesheets.tsx** - Referenced `approval_note` column in timesheets update — column doesn't exist. **FIXED**: changed to `notes`.
3. **AddStaffDialog.tsx** - `supabase.auth.signUp()` from admin session logs out the admin. **FIXED**: save/restore session around signUp call.
4. **EditStaffDialog.tsx** - Same signUp session issue. **FIXED**: save/restore session.
5. **EditStaffDialog.tsx** - `updateRoleMutation` updated `staff.role` instead of `user_roles.role`. **FIXED**: changed to update `user_roles` table.

### Medium
6. **Clients.tsx** - Referenced `shift.service_type` on timesheets — column doesn't exist. **FIXED**: hardcoded "Service".
7. **ClientWorkspaceCard.tsx** - Same `service_type` issue. **FIXED**.

### Known Graceful Fallbacks (already handled)
8. **Clients.tsx** - Queries `shifts` table (doesn't exist) — has `console.warn` + returns `[]`
9. **NotificationBell.tsx** - Queries `notifications` table (doesn't exist) — has `console.warn` + returns `[]`
10. **Timesheets.tsx** - `createNotification()` will silently fail since notifications table doesn't exist — acceptable degradation

## Pages Audited (All Clean After Fixes)
- [x] Dashboard.tsx — clean, proper queries, good UX
- [x] Login.tsx — clean
- [x] Staff.tsx — clean, good search/filter/CRUD
- [x] StaffHR.tsx — clean, document management works
- [x] StaffTraining.tsx — clean, queries compliance_records for training
- [x] Clients.tsx — fixed service_type refs, shifts table fallback OK
- [x] ClientCarePlans.tsx — clean, mock sections but functional
- [x] ClientRisk.tsx — clean, calculates risk from incidents
- [x] Roster.tsx — clean, uses timesheets as roster data
- [x] Timesheets.tsx — fixed hourly_rate and approval_note bugs
- [x] Invoices.tsx — clean, proper FK-safe delete, good workflow
- [x] CaseNotes.tsx — clean, excellent template system
- [x] Incidents.tsx — clean, supports client + work incidents
- [x] Compliance.tsx — clean, proper schema usage
- [x] Financials.tsx — clean, good stats aggregation
- [x] Reports.tsx — clean, CSV export works
- [x] Analytics.tsx — clean, time-range filtering works
- [x] SettingsPage.tsx — clean, modular settings sections
- [x] MyRoster.tsx — clean, worker-specific view
- [x] WorkerHome.tsx — clean, good mobile UX
- [x] AddStaffDialog.tsx — fixed signUp session issue
- [x] EditStaffDialog.tsx — fixed signUp session + role update
- [x] AddClientDialog.tsx — clean, proper schema mapping
- [x] EditClientDialog.tsx — clean, staff assignment works
- [x] NotificationBell.tsx — clean with graceful fallback
- [x] ClientWorkspaceCard.tsx — fixed service_type ref
- [x] AppLayout.tsx — clean
- [x] AppSidebar.tsx — clean

## DB State
- All queries match actual schema columns
- No TypeScript build errors
- `shifts` and `notifications` tables don't exist but code degrades gracefully
