# Deployment checklist

## Vercel
- Root directory: `frontend`
- Build command: `bun run build`
- Output directory: `dist`
- Install command: `bun install`

## Required Vite env vars
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID` (if used elsewhere)
- `VITE_SUPABASE_FUNCTIONS_URL` (if used elsewhere)

## Auth redirects
- Add Vercel domain to Supabase Auth Site URL
- Add `https://<your-domain>/**` to Redirect URLs

## Database
- Apply new migration: `frontend/supabase/migrations/20260519000000_case_notes_rls.sql`

## Notes
- App build currently passes locally with `bun run build` in `frontend`.
- Start script uses port 4200 locally, but Vercel ignores it.
