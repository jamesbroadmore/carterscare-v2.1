# Testing Guide

This document covers testing strategies, patterns, and best practices for Carter's Care.

## Testing Stack

- **Test Runner:** Vitest
- **Component Testing:** React Testing Library
- **Mocking:** Vitest built-in
- **Coverage:** Vitest coverage
- **E2E (future):** Playwright or Cypress

## Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test -- --coverage

# Single test file
npm run test -- AuthContext.test.ts
```

## Testing Patterns

### Unit Tests

Test individual functions and utilities:

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "./utils";

describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2025-03-25");
    expect(formatDate(date)).toBe("25 Mar 2025");
  });

  it("should handle invalid dates", () => {
    expect(() => formatDate(new Date("invalid"))).toThrow();
  });
});
```

### Component Tests

Test React components with React Testing Library:

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { Button } from "./button";

describe("Button", () => {
  it("should render button text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    screen.getByText("Click").click();
    expect(handleClick).toHaveBeenCalled();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByText("Click")).toBeDisabled();
  });
});
```

### Hook Tests

Test custom React hooks:

```typescript
// src/hooks/useAsync.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAsyncError } from "./use-async-error";

describe("useAsyncError", () => {
  it("should execute async function", async () => {
    const { result } = renderHook(() => useAsyncError());

    const mockFn = vi.fn().mockResolvedValue({ success: true });
    await result.current.execute(mockFn);

    expect(mockFn).toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const { result } = renderHook(() => useAsyncError());

    const mockFn = vi.fn().mockRejectedValue(new Error("Test error"));
    await result.current.execute(mockFn, { showToast: false });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
  });
});
```

### Context Tests

Test React Context providers:

```typescript
// src/contexts/AuthContext.test.tsx
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

describe("AuthContext", () => {
  it("should provide auth context", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current).toHaveProperty("session");
    expect(result.current).toHaveProperty("user");
    expect(result.current).toHaveProperty("signIn");
  });
});
```

## Testing Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Testing implementation
it("should call setState", () => {
  const setState = vi.fn();
  // ...
});

// ✅ Good: Testing behavior
it("should display user name when loaded", () => {
  render(<UserProfile />);
  expect(screen.getByText("John Doe")).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it("works", () => {});

// ✅ Good
it("should display loading spinner while fetching staff data", () => {});
```

### 3. Follow Arrange-Act-Assert

```typescript
it("should add staff member", () => {
  // Arrange
  const mockStaff = createMockStaff();
  
  // Act
  render(<AddStaffForm onSubmit={vi.fn()} />);
  userEvent.type(screen.getByLabelText("Name"), mockStaff.first_name);
  
  // Assert
  expect(screen.getByDisplayValue(mockStaff.first_name)).toBeInTheDocument();
});
```

### 4. Test Edge Cases

```typescript
it("should handle empty search results", () => {
  render(<SearchStaff query="nonexistent" />);
  expect(screen.getByText("No results found")).toBeInTheDocument();
});

it("should handle network errors", async () => {
  mockFetch.mockRejectedValue(new Error("Network error"));
  render(<StaffList />);
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### 5. Avoid Testing Implementation Details

```typescript
// ❌ Bad: Testing internal state
it("should set loading state", () => {
  const { result } = renderHook(useQuery);
  expect(result.current.isLoading).toBe(true);
});

// ✅ Good: Testing visible behavior
it("should show loading spinner", () => {
  render(<DataTable />);
  expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
});
```

## Mocking

### Mocking API Calls

```typescript
import { vi } from "vitest";
import * as supabaseClient from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [{ id: "1", name: "John" }],
        error: null,
      }),
    })),
  },
}));
```

### Mocking React Router

```typescript
import { vi } from "vitest";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "123" }),
  };
});
```

### Mocking Timers

```typescript
import { vi } from "vitest";

it("should debounce search", () => {
  vi.useFakeTimers();
  
  render(<SearchInput />);
  const input = screen.getByRole("textbox");
  
  userEvent.type(input, "search term");
  expect(vi.fn()).not.toHaveBeenCalled();
  
  vi.advanceTimersByTime(300);
  expect(vi.fn()).toHaveBeenCalled();
  
  vi.useRealTimers();
});
```

## Test Coverage

### Coverage Targets

```
Statements   : > 70%
Branches     : > 65%
Functions    : > 70%
Lines        : > 70%
```

### Generate Coverage Report

```bash
npm run test -- --coverage

# HTML report
npm run test -- --coverage --reporter=html
# Open coverage/index.html
```

### Improving Coverage

1. Identify uncovered code: `npm run test -- --coverage`
2. Write tests for critical paths
3. Focus on business logic over utilities
4. Test error scenarios and edge cases

## Testing Checklist

Before committing code:

- [ ] All tests pass (`npm run test`)
- [ ] No console errors/warnings
- [ ] Coverage > 70% for new code
- [ ] Tests are named descriptively
- [ ] Tests follow AAA pattern
- [ ] No skipped tests (`it.skip()`)
- [ ] Mocks are cleaned up

## Common Issues

### Tests Fail in CI But Pass Locally

**Solution:** Ensure NODE_ENV=test in CI, clear cache

### Vitest Cannot Find Module

**Solution:** Check tsconfig paths match, verify alias in vite.config.ts

### Component State Not Updating

**Solution:** Use `waitFor()` for async operations

```typescript
await waitFor(() => {
  expect(screen.getByText("Updated")).toBeInTheDocument();
});
```

### Mocks Not Working

**Solution:** Clear mocks between tests

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Write Tests Not Just For Coverage](https://kentcdodds.com/blog/write-tests-not-just-for-coverage)

## Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";

describe("Feature Name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle success scenario", async () => {
    // Arrange
    const mockData = { /* test data */ };

    // Act
    render(<Component data={mockData} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Expected text")).toBeInTheDocument();
    });
  });

  it("should handle error scenario", () => {
    // Arrange
    vi.mock("module", () => ({
      fn: vi.fn().mockRejectedValue(new Error("Test error")),
    }));

    // Act
    render(<Component />);

    // Assert
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Next Steps

1. Write tests for core features (Auth, Data fetching)
2. Aim for 70%+ coverage
3. Set up CI/CD to run tests automatically
4. Add pre-commit hooks to run tests before commits
5. Review coverage regularly
