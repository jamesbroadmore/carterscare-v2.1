# Carter's Care Platform - Vercel Deployment Guide

## Overview
This is a React/Vite frontend application that connects to Supabase for authentication and data storage. The platform is optimized for production deployment on Vercel.

## Quick Deploy Checklist
- [ ] Vercel account connected
- [ ] Environment variables set (see below)
- [ ] Supabase project configured
- [ ] Redirect URLs added to Supabase Auth

## Prerequisites
- Vercel account
- Supabase project with required tables and Edge Functions
- GitHub repository with the code

## Deployment Steps

### 1. Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `frontend` folder as the root directory

### 2. Configure Build Settings
Vercel should auto-detect these, but verify:
- **Framework Preset**: Vite
- **Build Command**: `yarn build`
- **Output Directory**: `dist`
- **Install Command**: `yarn install`

### 3. Set Environment Variables
In Vercel Project Settings > Environment Variables, add:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID | `abcdefghijkl` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJhbGci...` |
| `VITE_SUPABASE_URL` | Supabase API URL | `https://[project-id].supabase.co` |
| `VITE_SUPABASE_FUNCTIONS_URL` | Edge Functions URL | `https://[project-id].supabase.co/functions/v1` |

### 4. Deploy
Click "Deploy" and Vercel will build and deploy your application.

## Post-Deployment

### Update Supabase Auth Settings
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel domain to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### Custom Domain (Optional)
1. In Vercel Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase Auth settings with new domain

## Environment Variables Reference

```env
# Required
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_FUNCTIONS_URL="https://your-project.supabase.co/functions/v1"
```

## Production Features
- **Optimized Build**: Code splitting, tree shaking, minification
- **Security Headers**: XSS protection, frame denial, strict referrer
- **SPA Routing**: Automatic rewrites for client-side routing
- **Asset Caching**: Long-term caching for static assets
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Troubleshooting

### Build Failures
- Ensure all environment variables are set in Vercel
- Check that `VITE_` prefix is used for all client-side env vars
- Verify yarn.lock is committed to the repository

### Auth Issues
- Verify Supabase redirect URLs include your Vercel domain
- Check browser console for CORS errors
- Ensure Site URL is set correctly in Supabase

### 404 on Page Refresh
- The `vercel.json` includes rewrites for SPA routing
- If issues persist, check that `vercel.json` is in the frontend root

### Slow Initial Load
- First load may be slower due to cold start
- Subsequent loads use edge caching

## Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui
- **State**: React Query + React Context
- **Auth**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Animations**: Framer Motion

## Support
For issues, check the [Supabase docs](https://supabase.com/docs) or [Vercel docs](https://vercel.com/docs).
