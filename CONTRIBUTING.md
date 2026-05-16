# Contributing to Carter's Care

Thank you for your interest in contributing to Carter's Care! This guide will help you understand how to contribute effectively.

## Code of Conduct

- Be respectful and inclusive
- Report issues privately if they involve security concerns
- Follow best practices and project conventions
- Collaborate constructively with other contributors

## Getting Started

### Prerequisites
- Node.js 18+
- Git
- npm/pnpm package manager
- Basic knowledge of React, TypeScript, and Supabase

### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/jamesbroadmore/carterscare-v2.git
cd carterscare-v2/frontend

# Install dependencies
npm install

# Create .env.local from template
cp .env.example .env.local
# Fill in your Supabase credentials

# Start development server
npm run dev
```

## Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or for fixes:
git checkout -b fix/issue-description
```

### 2. Make Your Changes
Follow the code standards below.

### 3. Test Your Changes
```bash
# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Preview build locally
npm run preview
```

### 4. Commit Your Changes
Use descriptive commit messages:
```bash
git commit -m "feat: add new dashboard widget"
git commit -m "fix: correct validation in staff form"
git commit -m "docs: update deployment guide"
```

**Commit Message Format:**
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` code style changes (formatting, etc.)
- `refactor:` code refactoring
- `perf:` performance improvements
- `test:` test updates
- `chore:` build, CI, dependencies

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then open a PR on GitHub with:
- Clear title describing the change
- Description of what changed and why
- Reference to related issues (if any)
- Screenshots for UI changes

## Code Standards

### TypeScript
- Enable strict mode: `strict: true`
- Use proper type annotations instead of `any`
- Create interfaces for complex objects
- Example:
  ```typescript
  interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }

  const createStaff = async (staff: Staff): Promise<void> => {
    // ...
  };
  ```

### React Components
- Use functional components with hooks
- Keep components focused and single-responsibility
- Use TypeScript for props
  ```typescript
  interface StaffCardProps {
    staff: Staff;
    onEdit: (staff: Staff) => void;
    onDelete: (id: string) => void;
  }

  export function StaffCard({ staff, onEdit, onDelete }: StaffCardProps) {
    // ...
  }
  ```

### Naming Conventions
- Components: PascalCase (`StaffList.tsx`)
- Hooks: camelCase with `use` prefix (`useStaffData.ts`)
- Files: kebab-case for utilities (`staff-utils.ts`)
- Constants: UPPER_SNAKE_CASE
  ```typescript
  export const API_TIMEOUT = 5000;
  export const ROLES = ["admin", "user"] as const;
  ```

### Import Organization
```typescript
// 1. External libraries
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal components
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";

// 3. Internal utilities
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/utils";

// 4. Types and constants
import type { Staff } from "@/types";
import { QUERY_KEYS } from "@/lib/constants";
```

### Code Formatting
All code is formatted with Prettier (runs automatically on commit):
```bash
npm run lint:fix  # Auto-format code
```

## Testing

### Unit Tests
Test individual functions and components:
```typescript
import { describe, it, expect } from "vitest";
import { formatStaffName } from "@/lib/utils";

describe("formatStaffName", () => {
  it("should format staff name correctly", () => {
    expect(formatStaffName("john", "doe")).toBe("John Doe");
  });
});
```

### Integration Tests
Test component interactions:
```typescript
import { render, screen } from "@testing-library/react";
import { StaffForm } from "@/components/StaffForm";

describe("StaffForm", () => {
  it("should submit form data", async () => {
    render(<StaffForm onSubmit={vi.fn()} />);
    // Test interactions
  });
});
```

Run all tests:
```bash
npm run test
```

## Performance Considerations

- Use React Query for data fetching (caching, retries)
- Lazy load components: `const Component = lazy(() => import('./Component'))`
- Optimize images (use modern formats, lazy load)
- Monitor bundle size: `npm run build`
- Use React DevTools Profiler to identify slow renders

## Documentation

- Update README.md for user-facing changes
- Update DEPLOYMENT.md for deployment changes
- Add inline comments for complex logic
- Document public APIs and interfaces
- Update this file for process changes

## Common Issues

### TypeScript Errors
```bash
# Clear cache and rebuild
rm -rf node_modules
npm install
npm run build
```

### Vite/Build Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

### Supabase Connection
- Verify `.env.local` has correct Supabase URL and key
- Check Supabase project is active
- Verify RLS policies allow access

## Review Process

### What Reviewers Look For
1. **Code Quality:** Follows standards, no console errors, proper types
2. **Functionality:** Changes work as intended, no regressions
3. **Performance:** No unnecessary re-renders, efficient queries
4. **Tests:** Adequate coverage, meaningful tests
5. **Documentation:** Changes documented, clear commit messages

### Before Submitting PR
- [ ] Run `npm run lint:fix` to format code
- [ ] Run `npm run test` and ensure tests pass
- [ ] Run `npm run build` and check for errors
- [ ] Test in development: `npm run dev`
- [ ] Add/update tests if applicable
- [ ] Update documentation
- [ ] Self-review your code

## Release Process

1. Update version in `package.json`
2. Create release notes in CHANGELOG.md
3. Merge to main branch
4. Push to GitHub
5. Vercel automatically deploys to production
6. Create GitHub release with version tag

## Getting Help

- **Questions:** Check README.md and existing documentation
- **Issues:** Search existing GitHub issues first
- **Bugs:** Create detailed GitHub issue with reproduction steps
- **Security:** Email security@carterscare.com (do not open public issues)

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Query](https://tanstack.com/query/latest)

## Attribution

By contributing, you agree that your contributions will be licensed under the same license as this project.

Thank you for contributing to Carter's Care!
