# Deployment Guide

This document provides step-by-step instructions for deploying Carter's Care to production.

## Prerequisites
- Node.js 18+ and npm/pnpm installed
- Vercel account for hosting (or alternative like Netlify)
- Supabase project created and configured
- Git repository connected to version control

## Environment Setup

### 1. Supabase Configuration
1. Create a Supabase project at https://supabase.com
2. Run all migrations in `frontend/supabase/migrations/`
3. Create a role for the application:
   ```sql
   CREATE ROLE app_user NOINHERIT;
   GRANT USAGE ON SCHEMA public TO app_user;
   ```
4. Enable Row Level Security (RLS) on all tables
5. Set up RLS policies for data protection

### 2. Environment Variables
Create `.env.local` in the `frontend` directory:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never commit this file to version control.

### 3. Local Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Vercel Deployment

### 1. Connect Repository
1. Go to https://vercel.com
2. Import your GitHub/GitLab repository
3. Select the `frontend` directory as the root
4. Click "Deploy"

### 2. Configure Environment Variables
In Vercel project settings:
1. Go to Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Select environments (Production, Preview, Development)

### 3. Build Settings
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### 4. Deploy
Each push to main branch automatically deploys to production.

## Performance Checklist

- [ ] Bundle size < 250KB (check with `npm run build`)
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals optimized
- [ ] Images optimized and lazy-loaded
- [ ] Code splitting configured
- [ ] Caching headers set correctly

## Monitoring

### Error Tracking
Consider integrating error tracking service:
- Sentry for React errors
- LogRocket for session replay
- DataDog for APM

### Analytics
Track user behavior with:
- Google Analytics
- PostHog
- Mixpanel

### Uptime Monitoring
Set up uptime monitoring:
- UptimeRobot (free tier)
- Pingdom
- Better Stack

## Database Migrations

### Running Migrations
1. Supabase handles migrations automatically
2. For custom migrations:
   ```bash
   # Create new migration
   supabase migration new migration_name

   # Apply migrations
   supabase db push
   ```

### Backup & Recovery
- Supabase provides daily backups
- Enable Point-in-Time Recovery (PITR)
- Test recovery process regularly

## Security Checklist

- [ ] SSL/TLS enabled (automatic with Vercel)
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] RLS policies enabled
- [ ] Admin roles properly restricted
- [ ] Audit logging enabled
- [ ] 2FA enabled for admin accounts

## Rollback Procedures

### Vercel Rollback
1. Go to Deployments
2. Click the deployment to rollback to
3. Click "Redeploy"

### Database Rollback
1. Use Supabase backup feature
2. Or manually revert migrations:
   ```bash
   supabase db reset  # ⚠️ Use only in development
   ```

## Scaling Considerations

### Current Architecture Limits
- Supabase free tier: 500 MB database
- Vercel deployment: Auto-scales (concurrent requests)
- Vite build: ~200KB for core app

### When to Scale
- Database: > 400 MB
- API calls: > 100 requests/second
- Concurrent users: > 1000

### Scaling Options
1. Upgrade Supabase plan
2. Implement caching layer (Redis)
3. Add CDN for static assets
4. Implement database read replicas

## Logging & Debugging

### View Logs
**Vercel:**
```bash
vercel logs [deployment-url]
```

**Supabase:**
- Go to Dashboard → Logs → API Requests
- Check RLS policy violations
- Monitor authentication events

### Debug Production Issues
1. Check Vercel deployment logs
2. Check browser console (client-side)
3. Check Supabase query logs
4. Check error tracking service (if integrated)

## Health Checks

Create a health endpoint to monitor:
```typescript
// endpoint: /api/health
{
  "status": "ok",
  "timestamp": "2025-03-25T10:30:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

## Post-Deployment Tasks

1. **Smoke Tests**
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] Core features function
   - [ ] No console errors

2. **Performance Tests**
   - [ ] Run Lighthouse audit
   - [ ] Check bundle size
   - [ ] Monitor Core Web Vitals
   - [ ] Test on slow network

3. **Security Tests**
   - [ ] Test CSRF protection
   - [ ] Verify RLS policies
   - [ ] Check security headers
   - [ ] Test unauthorized access

4. **Communication**
   - [ ] Notify users of deployment
   - [ ] Document any breaking changes
   - [ ] Share feature release notes

## Troubleshooting

### Build Fails
1. Check Node version: `node --version`
2. Clear cache: `npm cache clean --force`
3. Reinstall: `rm -rf node_modules && npm install`
4. Check for TypeScript errors: `npm run lint`

### Environment Variables Not Loading
1. Verify variables exist in Vercel settings
2. Check variable names match code
3. Redeploy to apply changes
4. Clear browser cache

### Database Connection Issues
1. Verify Supabase URL is correct
2. Check network connectivity
3. Verify RLS policies allow access
4. Check Supabase status page

### Performance Issues
1. Check bundle size: `npm run build`
2. Monitor API response times
3. Check database query performance
4. Implement caching if needed

## Support

For deployment issues:
1. Check Vercel documentation: https://vercel.com/docs
2. Check Supabase documentation: https://supabase.com/docs
3. Review application logs
4. Contact support team
