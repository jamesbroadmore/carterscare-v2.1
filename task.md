# Task: Staff onboarding compliance + completion tracking

## Goal
1. Ensure all staff have completed onboarding — need an admin-facing view of completion status.
2. Fix onboarding content/checklist to align with actual NDIS/Aged Care legislation (both apply).

## Findings
- Two onboarding UIs:
  - `StaffOnboardingWizard.tsx` (route `/staff-onboarding`, sidebar "Onboarding") — FAKE. No DB writes for docs/training, all local state, resets on refresh. Linked from sidebar for support workers.
  - `Onboarding.tsx` (route `/onboarding`) — REAL. Backed by onboarding_tasks, policies, policy_acknowledgements tables. Not linked in sidebar at all (orphaned route, "legacy" per App.tsx comment) — but this is the one that actually works.
- DB migration `20260316193754...sql` already seeds correct legislation-aligned onboarding_tasks via trigger `create_onboarding_tasks()` on staff insert:
  NDIS Worker Screening Check, Working with Children Check, National Police Check, First Aid Certificate,
  CPR Certificate, Driver Licence, Contractor Agreement Signed, Code of Conduct Acknowledged, Privacy Policy Acknowledged, Safeguarding Policy Acknowledged.
  - Issue: WWCC + National Police Check listed as separate always-required items. Per legislation: NDIS Worker Screening Check supersedes plain police check for risk-assessed roles (aged care from 1 Jul 2025 also accepts NDIS Worker Screening Check OR police cert <3yrs). WWCC only required if child-related work. Need to correct default task set + compliance record types + add missing NDIS Worker Orientation Module.
- `Compliance.tsx` "Staff Records" tab already shows per-staff completion against required=["worker_screening","wwcc","police_check","first_aid","cpr"] — same legislative issue (treats wwcc as blanket-required, missing NDIS Orientation module, no aged care screening equivalent).
- No admin view for onboarding_tasks/policy_acknowledgements completion — need to add one so admin can "ensure all staff have partaken."
- DB is live (Supabase project lwfqrtehouwfnwcikvhh) but empty — no staff yet, no data, so no live rows to migrate/backfill, just need to fix code + migration.

## Plan
1. Remove StaffOnboardingWizard entirely (fake), remove /staff-onboarding route, update sidebar to point "Onboarding" nav item to /onboarding for support_worker.
2. Fix default onboarding tasks / required record types to match legislation:
   - Replace "National Police Check" + "Working with Children Check" hard requirement with a single "Worker Screening Check (NDIS Worker Screening Check or National Police Certificate <3yrs)" task, keep WWCC as a separate task but mark optional/conditional (only required if working with children) — flag in UI as conditional.
   - Add "NDIS Worker Orientation Module (Quality, Safety and You)" task — this is the actual mandated NDIS training module.
   - Keep First Aid, CPR, Manual Handling, Code of Conduct, Privacy Policy, Safeguarding Policy — all legit Aged Care Quality Standards / NDIS Practice Standards expectations.
   - Remove blanket COVID vaccination requirement (no longer mandated).
3. Update Compliance.tsx RECORD_TYPES + required[] list to match.
4. Add an admin-facing "Onboarding Completion" view (new tab in Compliance.tsx or Staff HR) showing all staff with onboarding_tasks + policy_acknowledgements completion %, flags anyone incomplete.
5. Update DB migration: new migration file adjusting create_onboarding_tasks() task list + seeded policies (add NDIS Code of Conduct specific wording already exists as "Code of Conduct" - fine).
6. Test build, commit, push branch, open PR.

## Status: in progress
