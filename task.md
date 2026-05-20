# CartersCare Migration & Pricing Task

## Completed
- [x] .env.local updated to new Supabase project (nylejfcszdkamnkkjryt)
- [x] types.ts updated with rate_weekday/rate_saturday/rate_sunday/rate_public_holiday
- [x] AddClientDialog — pricing fields added (schema, form, insert, UI)
- [x] EditClientDialog — pricing fields added (schema, form, update, UI)
- [x] Clients.tsx OverviewTab — Hourly Rates card with edit support
- [x] CreateInvoiceDialog — client-specific rates (no more hardcoded $60/$90/$120)
- [x] EditInvoiceDialog — client-specific rates
- [x] Build passes cleanly

## Waiting On
- [ ] User runs migration.sql in Supabase SQL Editor
- [ ] Create demo auth user in new Supabase project

## Remaining After Migration
- [ ] Test locally with new DB
- [ ] Push to GitHub
- [ ] Update Vercel env vars
- [ ] Verify production
