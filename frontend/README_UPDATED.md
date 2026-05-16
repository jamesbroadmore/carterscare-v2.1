# Carter's Care Frontend

A comprehensive care management platform for NDIS and aged care operations.

## Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account and project

### Setup
```bash
# Install dependencies
npm install

# Create environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests
npm run test

# Watch mode for tests
npm run test:watch

# Lint and format code
npm run lint
npm run lint:fix

# Analyze bundle size
node scripts/analyze-bundle.js
```

## Project Structure

```
src/
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── ...            # Custom components
├── contexts/          # React contexts (Auth, etc.)
├── hooks/             # Custom React hooks
├── lib/               # Utilities and constants
│   ├── constants.ts   # Application constants
│   ├── security.ts    # Security utilities
│   └── utils.ts       # Helper functions
├── pages/             # Page components
├── types/             # TypeScript type definitions
├── integrations/      # External service integrations
│   └── supabase/      # Supabase client
├── test/              # Test utilities and setup
└── App.tsx            # Root component
```

## Architecture

### Component Structure
- **Pages**: Full-page components representing routes
- **Components**: Reusable UI components
- **Layouts**: Layout wrappers (AppLayout, WorkerLayout)
- **UI Kit**: Shadcn/ui components

### State Management
- **React Query**: Server state and caching
- **React Context**: Auth state
- **useState/useReducer**: Local component state

### Data Flow
1. API requests via React Query
2. Automatic caching and synchronization
3. Optimistic updates where applicable
4. Error handling with retry logic

## Key Features

### Authentication
- Supabase Auth integration
- Role-based access control
- Auto-refresh tokens
- Session persistence

### Admin Features
- Staff management
- Client management
- Roster management
- Compliance tracking
- Incident reporting
- Financial management
- Reporting dashboard

### Worker Features
- Check-in/check-out
- Case notes
- Compliance requirements
- Personal dashboard

## Styling

### Tailwind CSS
- Custom design tokens in `src/index.css`
- Semantic color variables
- Responsive design with utility classes

### Color Palette
- Primary: Purple (#8b5cf6)
- Accent: Blue (#3b82f6)
- Success: Green (#4ade80)
- Warning: Amber (#f59e0b)
- Destructive: Red (#ef4444)

### Typography
- Sans: Plus Jakarta Sans / Source Sans Pro
- Serif: Source Serif Pro
- Mono: Source Code Pro

## Configuration

### Environment Variables
See `.env.example` for template:

```
VITE_SUPABASE_URL=         # Your Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY=  # Your Supabase public key
```

### TypeScript
- Strict mode enabled
- Path alias `@/*` maps to `src/*`
- Type definitions in `src/types/`

### Vite Config
- Code splitting by library (vendor, ui, charts, etc.)
- ESBuild minification
- Gzip compression reporting
- Development server on port 3000

## Performance

### Bundle Size
- Main bundle: < 250KB
- Vendor chunk: < 180KB
- UI chunk: < 100KB

### Optimization Strategies
- Route-based code splitting
- React Query for data caching
- Image lazy loading
- Dynamic imports for heavy components

### Monitoring
- Lighthouse audits
- Core Web Vitals tracking
- Bundle analysis: `node scripts/analyze-bundle.js`

## Testing

### Test Framework
- Vitest for unit and component tests
- React Testing Library for component testing
- Mock utilities in `src/test/`

### Running Tests
```bash
npm run test           # Run all tests
npm run test:watch    # Watch mode
npm run test -- --coverage  # With coverage report
```

See `TESTING.md` for detailed testing guide.

## Security

### Best Practices
- Strict TypeScript configuration
- XSS protection via React
- CSRF protection ready
- Security headers configured
- Environment variable protection

### Data Security
- Supabase Row Level Security (RLS)
- Parameterized queries
- Input validation
- Token refresh mechanism

See `SECURITY.md` for comprehensive security guide.

## Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Set environment variables in Vercel
3. Auto-deploys on main branch

### Build Settings
- Framework: Vite
- Build Command: `npm run build`
- Output: `dist/`

See `DEPLOYMENT.md` for detailed deployment guide.

## Troubleshooting

### Development Issues

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9
```

**Module Not Found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**
```bash
# Rebuild TypeScript
npm run build
```

### Runtime Issues

Check browser console for errors. Enable debug logging:
```typescript
// In any component
console.log("[DEBUG]", variable);
```

## Contributing

See `CONTRIBUTING.md` for:
- Code standards
- Development workflow
- Commit message format
- Pull request process
- Testing requirements

## Documentation

- **DEPLOYMENT.md** - Deployment and infrastructure
- **SECURITY.md** - Security guidelines and practices
- **PERFORMANCE.md** - Performance optimization
- **TESTING.md** - Testing strategies and patterns
- **CONTRIBUTING.md** - Contributing guidelines

## Technologies

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library

### State & Data
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Supabase** - Backend and database

### Development
- **Vitest** - Testing
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TS linting

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Mobile browsers (iOS Safari, Chrome Mobile) supported.

## Performance Targets

- Lighthouse Score: > 90
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- Bundle Size: < 250KB

## Monitoring & Analytics

### Recommended Services
- Error Tracking: Sentry
- Analytics: PostHog or Google Analytics
- Uptime: UptimeRobot
- Performance: Vercel Analytics

## Support

For issues and questions:
1. Check existing documentation
2. Search GitHub issues
3. Create new issue with details
4. Contact team via security email for security issues

## License

See LICENSE file in root directory

## Authors

- James Broadmore (@jamesbroadmore)
- Development Team

## Changelog

See Git history for detailed changes. Major versions:

- v1.0.0 - Initial release

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

## Getting Help

- Documentation: Check README and guides
- Issues: Open GitHub issue
- Discussions: GitHub Discussions
- Security: security@carterscare.com (do not open public issues)

---

Happy coding! 🚀
