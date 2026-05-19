# Audit & Polish — Carter's Care

## Issues Found

### Critical
1. **EditInvoiceDialog** — uses old `abn` field that doesn't exist in new schema; needs rewrite to match new admin flow
2. **Invoices page empty state** — says "Create one from your approved timesheets" — wrong copy (admin creates them)
3. **WorkerLayout roster nav** — links to `/roster` (admin page, 403 for workers) — should be `/my-roster`
4. **Dashboard** — redirects support_workers to /worker — but no role-based redirect for real (non-demo) Supabase logins
5. **console.log** in Requests.tsx — remove before deploy
6. **invoice_date** — Invoices table may not have `invoice_date` populated on insert (CreateInvoiceDialog doesn't set it)

### Polish / Enhancement
7. **Invoices list** — no filter by client, no date range filter
8. **ViewInvoiceDialog** — `invoice_date` may be null (shows today's date as fallback, fine)
9. **AppLayout search button** — renders but does nothing — remove or implement
10. **Financials page** — sparse, improve with invoice revenue data
11. **Invoices page** — delete button for draft invoices (admin cleanup)
12. **CreateInvoiceDialog** — should set `invoice_date` to today on insert
13. **WorkerHome** — Notifications section, check tab routing
14. **Login redirect** — real Supabase users always go to "/" — support_workers should go to "/worker"
15. **B2BDashboard.tsx** — page exists but no route — dead file
16. **Sidebar** — "My Compliance" not in sidebar for workers
17. **Invoices empty state copy** — fix messaging

## Fix Order
1. Fix console.log in Requests
2. Fix WorkerLayout roster link
3. Fix invoice_date on create 
4. Fix Login redirect for real Supabase auth
5. Rewrite EditInvoiceDialog to match new format
6. Add delete invoice for drafts
7. Fix Invoices empty state copy  
8. Fix search button (remove it)
9. Improve Financials with invoice data
10. Add client filter to Invoices list
