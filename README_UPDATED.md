# Carter's Care v2

A comprehensive care management platform for NDIS and aged care organizations.

## Overview

Carter's Care is a full-stack web application built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL)
- **Hosting**: Vercel

The platform streamlines operations including rostering, compliance, case notes, timesheets, invoicing, and incident management.

## Quick Links

- **Frontend README**: [frontend/README_UPDATED.md](./frontend/README_UPDATED.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Security Guide**: [SECURITY.md](./SECURITY.md)
- **Performance Guide**: [PERFORMANCE.md](./PERFORMANCE.md)
- **Testing Guide**: [TESTING.md](./TESTING.md)
- **Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Getting Started

### Prerequisites
- Node.js 18+
- Git
- Supabase account (free tier available)
- Vercel account for deployment (optional)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/jamesbroadmore/carterscare-v2.git
cd carterscare-v2

# Install dependencies
cd frontend
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
carterscare-v2/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities
│   │   ├── pages/              # Page components
│   │   ├── types/              # TypeScript types
│   │   └── integrations/       # External integrations
│   ├── public/                 # Static assets
│   ├── supabase/               # Database migrations
│   ├── scripts/                # Build scripts
│   ├── .env.example            # Environment template
│   └── package.json
├── DEPLOYMENT.md               # Deployment instructions
├── SECURITY.md                 # Security guidelines
├── PERFORMANCE.md              # Performance guide
├── TESTING.md                  # Testing guide
└── CONTRIBUTING.md             # Contributing guide
```

## Development Workflow

### 1. Feature Development

```bash
cd frontend

# Create feature branch
git checkout -b feature/your-feature

# Start development
npm run dev

# Make changes, test locally
npm run test
npm run lint:fix

# Build and verify
npm run build
npm run preview
```

### 2. Commit & Push

```bash
git commit -m "feat: description of feature"
git push origin feature/your-feature
```

### 3. Pull Request

Open PR on GitHub with:
- Clear title and description
- Reference to related issues
- Screenshots for UI changes

### 4. Merge & Deploy

- Code review and approval required
- Merge to main branch
- Vercel automatically deploys to production

## Core Features

### Admin Dashboard
- Real-time KPIs and metrics
- Staff and client management
- Roster scheduling
- Compliance tracking
- Incident management
- Financial dashboards
- Reporting and analytics

### Staff Management
- Staff directory with contact info
- Role assignment
- Compliance tracking
- Document management

### Rostering
- Weekly roster creation
- Shift assignment
- Shift swap requests
- Automatic conflict detection

### Timesheets
- Digital timesheet submission
- Approval workflow
- Overtime tracking
- Export for payroll

### Invoicing
- Invoice generation
- Payment tracking
- Billing validation
- Export for accounting

### Compliance
- Compliance requirement tracking
- Document upload
- Audit trails
- Automated alerts

### Case Notes
- Client case note recording
- Rich text formatting
- Category tagging
- Search and filtering

### Incidents
- Incident reporting
- Priority and status tracking
- Investigation workflows
- Audit logging

## Technology Stack

### Frontend
- React 18
- TypeScript 5
- Vite 5
- Tailwind CSS 3
- Shadcn/UI components
- React Query 5
- React Router 6
- Framer Motion
- Recharts

### Backend
- Supabase (PostgreSQL)
- PostgREST API
- Real-time subscriptions
- Row-Level Security (RLS)
- Authentication

### DevOps
- Vercel (hosting)
- GitHub (version control)
- Environment variables
- Automated deployments

### Development Tools
- ESLint
- Prettier
- Vitest
- TypeScript ESLint

## Key Improvements (v0 → v1)

### Type Safety
- ✅ TypeScript strict mode enabled
- ✅ Custom type definitions
- ✅ No implicit `any`
- ✅ Null checking

### Error Handling
- ✅ Error boundary component
- ✅ Custom error hooks
- ✅ Loading skeletons
- ✅ Proper error messages

### Code Quality
- ✅ Stricter ESLint rules
- ✅ Prettier formatting
- ✅ Unused variable detection
- ✅ Code organization

### Performance
- ✅ Bundle size optimization
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Bundle analyzer

### Testing
- ✅ Test utilities
- ✅ Example tests
- ✅ Mock setup
- ✅ Coverage framework

### Security
- ✅ Security headers
- ✅ Input validation
- ✅ CSRF protection ready
- ✅ Security utilities

### Documentation
- ✅ Deployment guide
- ✅ Security guide
- ✅ Performance guide
- ✅ Testing guide
- ✅ Contributing guide

## Configuration

### Environment Variables

Create `frontend/.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Build Configuration

- Vite for bundling
- ESBuild for minification
- Gzip compression enabled
- Code splitting configured

### TypeScript Configuration

- Strict mode: enabled
- NoImplicitAny: true
- StrictNullChecks: true
- ESM modules

## Deployment

### Vercel Deployment

```bash
# Automatic on main branch push
# Or manually:
vercel --prod
```

### Environment Setup

1. Create Supabase project
2. Run migrations
3. Configure RLS policies
4. Set Vercel env variables
5. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

## Performance

### Current Metrics
- Bundle size: ~200KB (gzipped)
- Lighthouse score: 90+
- Core Web Vitals: All green

### Targets
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

Monitor with Vercel Analytics.

## Security

### Implemented
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ HTTPS enforcement
- ✅ XSS protection
- ✅ CSRF ready
- ✅ Input validation

### Recommendations
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Incident response plan

See [SECURITY.md](./SECURITY.md) for guidelines.

## Testing

### Coverage
- Unit tests: functions and hooks
- Component tests: UI behavior
- Integration tests: workflows

Run with:
```bash
npm run test          # All tests
npm run test:watch   # Watch mode
npm run test -- --coverage  # With coverage
```

Target: > 70% coverage for critical paths

See [TESTING.md](./TESTING.md) for strategies.

## Monitoring

### Recommended Services
- **Error Tracking**: Sentry
- **Analytics**: PostHog / Google Analytics
- **Uptime**: UptimeRobot
- **Performance**: Vercel Analytics

### Metrics to Track
- Error rates
- User behavior
- API response times
- Database query performance
- Core Web Vitals

## Support & Issues

### Reporting Issues
1. Check existing issues
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual
   - Environment info

### Security Issues
⚠️ **Do not** open public issues for security concerns.

Email: security@carterscare.com

### Getting Help
- Documentation: See guides above
- Discussions: GitHub Discussions
- Team: Internal Slack channel

## Roadmap

### Phase 2 (Planned)
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] API webhooks
- [ ] Document management
- [ ] Multi-site support

### Phase 3 (Future)
- [ ] AI-powered insights
- [ ] Automated scheduling
- [ ] Mobile offline support
- [ ] Advanced integrations

## License

[See LICENSE file](./LICENSE)

## Team

- James Broadmore (@jamesbroadmore)
- Development Team

## Changelog

### v1.0.0 (Current)
- TypeScript strict mode
- Error boundaries and handling
- Performance optimizations
- Testing framework
- Security hardening
- Comprehensive documentation

### v0.0.1 (Previous)
- Initial build with Lovable
- Core features implemented
- Basic routing and auth

## Resources

### Documentation
- [Frontend README](./frontend/README_UPDATED.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)
- [Performance Guide](./PERFORMANCE.md)
- [Testing Guide](./TESTING.md)
- [Contributing Guide](./CONTRIBUTING.md)

### External Links
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vercel Docs](https://vercel.com/docs)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code standards
- Development workflow
- Commit conventions
- Pull request process

## Quick Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build

# Testing & Quality
npm run test          # Run tests
npm run test:watch   # Watch mode
npm run lint          # Lint code
npm run lint:fix      # Auto-fix linting

# Analysis
node scripts/analyze-bundle.js  # Bundle size analysis
npm run test -- --coverage      # Coverage report
```

## Performance Checklist

Before deploying:
- [ ] Lighthouse score > 90
- [ ] Bundle size < 250KB
- [ ] No console errors
- [ ] Tests passing
- [ ] No unused dependencies
- [ ] Environment vars configured
- [ ] Security headers set
- [ ] Performance optimized

---

**Last Updated**: March 25, 2026  
**Status**: Production Ready  
**Version**: 1.0.0
