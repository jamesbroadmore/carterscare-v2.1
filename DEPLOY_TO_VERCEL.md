# Deploy to Vercel

## Project settings
- Root Directory: `frontend`
- Build Command: `bun run build`
- Install Command: `bun install`
- Output Directory: `dist`

## Environment variables
Use the block in `VERCEL_ENV_BLOCK.txt`.

## Database
Apply Supabase migration:
- `frontend/supabase/migrations/20260519000000_case_notes_rls.sql`

## Supabase auth
Add your Vercel domain to:
- Site URL
- Redirect URLs

## After deploy
Check:
- login
- clients page
- case notes create/view
- ask maureen route
