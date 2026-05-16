# Performance Optimization Guide

This document outlines performance metrics, optimization strategies, and monitoring for Carter's Care.

## Core Web Vitals

### Targets
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **FCP (First Contentful Paint):** < 1.8s
- **TTFB (Time to First Byte):** < 600ms

### Measuring
```bash
# Run Lighthouse audit
npm run build
npm run preview

# Then use:
# - Chrome DevTools → Lighthouse
# - PageSpeed Insights: https://pagespeed.web.dev
# - WebPageTest: https://www.webpagetest.org
```

## Bundle Size Optimization

### Current Bundle Breakdown
```bash
npm run build
# Check dist/index.html for bundle analysis
```

### Optimization Techniques

#### 1. Code Splitting
```typescript
// Use React.lazy for route-based splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Staff = lazy(() => import("./pages/Staff"));

// Wrap with Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <Dashboard />
</Suspense>
```

#### 2. Dependency Optimization
- Remove unused packages
- Use tree-shakeable libraries
- Prefer es6 modules

```bash
# Analyze bundle
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [visualizer()]
```

#### 3. Dynamic Imports
```typescript
// Load heavy components only when needed
const AIChatbot = lazy(() => import("./components/AIChatbot"));

<Suspense fallback={null}>
  <AIChatbot />
</Suspense>
```

## Runtime Performance

### React Performance

#### Avoid Unnecessary Re-renders
```typescript
// Use React.memo for expensive components
const StaffCard = memo(({ staff }: Props) => {
  return <div>{staff.name}</div>;
});

// Use useCallback for stable function references
const handleDelete = useCallback((id: string) => {
  deleteStaff(id);
}, []);

// Use useMemo for expensive computations
const sortedStaff = useMemo(() => {
  return staff.sort((a, b) => a.name.localeCompare(b.name));
}, [staff]);
```

#### Proper List Rendering
```typescript
// Always use stable keys
{staff.map((member) => (
  <StaffCard key={member.id} staff={member} />
))}

// Not this:
{staff.map((member, index) => (
  <StaffCard key={index} staff={member} />
))}
```

### React Query Optimization

#### Efficient Query Configuration
```typescript
const { data } = useQuery({
  queryKey: ["staff"],
  queryFn: fetchStaff,
  // Reduce refetch frequency
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,    // 10 minutes (was cacheTime)
  // Prevent unnecessary fetches
  enabled: !!userId,
  // Retry strategy
  retry: 1,
  retryDelay: 1000,
});
```

### Network Optimization

#### API Call Batching
```typescript
// Bad: Multiple requests
const staff = useQuery({ queryKey: ["staff"], ... });
const clients = useQuery({ queryKey: ["clients"], ... });
const roster = useQuery({ queryKey: ["roster"], ... });

// Better: Batch when possible
const { data } = useQuery({
  queryKey: ["dashboard"],
  queryFn: async () => {
    const [staff, clients, roster] = await Promise.all([
      fetchStaff(),
      fetchClients(),
      fetchRoster(),
    ]);
    return { staff, clients, roster };
  },
});
```

#### Request Debouncing
```typescript
import { useDeferredValue } from "react";

const SearchStaff = () => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  // This won't refetch on every keystroke
  const { data } = useQuery({
    queryKey: ["search", deferredQuery],
    queryFn: () => searchStaff(deferredQuery),
    enabled: deferredQuery.length > 0,
  });

  return <input onChange={(e) => setQuery(e.target.value)} />;
};
```

## Image Optimization

### Best Practices
```typescript
// Use modern formats with fallbacks
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <img src="/image.jpg" alt="Description" loading="lazy" />
</picture>

// Responsive images
<img
  src="/image.jpg"
  srcSet="/image-sm.jpg 400w, /image-md.jpg 800w"
  sizes="(max-width: 400px) 400px, 800px"
  alt="Description"
  loading="lazy"
/>
```

### Image Tools
- **Compression:** TinyPNG, ImageOptim, ImageMagick
- **Format Conversion:** Squoosh, CloudConvert
- **Responsive Generation:** ImageEngine, Cloudinary

## Caching Strategy

### Browser Caching
```typescript
// Cache static assets (handled by Vercel)
// Cache duration: 1 year for content-hashed files
// Cache duration: 1 hour for index.html
```

### Query Caching
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min
      gcTime: 10 * 60 * 1000,      // 10 min
    },
  },
});
```

### IndexedDB Caching
```typescript
// For large datasets, consider IndexedDB
import { openDB } from "idb";

const dbPromise = openDB("carter-care-db", 1, {
  upgrade(db) {
    db.createObjectStore("staff");
    db.createObjectStore("clients");
  },
});

// Use for offline support or faster loads
```

## Monitoring

### Real User Monitoring (RUM)
```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendMetrics(metric: Metric) {
  // Send to analytics service
  fetch("/api/metrics", {
    method: "POST",
    body: JSON.stringify(metric),
  });
}

getCLS(sendMetrics);
getFID(sendMetrics);
getFCP(sendMetrics);
getLCP(sendMetrics);
getTTFB(sendMetrics);
```

### Error Rate Monitoring
```typescript
// Track error rates
window.addEventListener("error", (event) => {
  fetch("/api/errors", {
    method: "POST",
    body: JSON.stringify({
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href,
    }),
  });
});
```

### Query Performance
```typescript
// Monitor slow queries
const slowQueryAlert = (duration: number) => {
  console.warn(`Slow query detected: ${duration}ms`);
};
```

## Development Tools

### Bundle Analysis
```bash
# Generate bundle report
npm install --save-dev rollup-plugin-visualizer
# Add to vite.config.ts and run build
```

### Performance DevTools
- Chrome DevTools Lighthouse
- Firefox DevTools Performance
- WebPageTest
- Bundle Phobia

### React DevTools
```bash
# Install React DevTools extension
# Use Profiler tab to identify slow renders
```

## Common Performance Issues

### Problem: Slow Initial Load
**Solutions:**
- Reduce bundle size (code splitting, lazy loading)
- Optimize images (compression, modern formats)
- Enable gzip compression (Vercel default)
- Implement critical CSS inlining

### Problem: Slow Interactions
**Solutions:**
- Reduce main thread work
- Use Web Workers for heavy computation
- Implement request debouncing/throttling
- Optimize React render performance

### Problem: Slow Data Fetching
**Solutions:**
- Implement pagination
- Use filters to reduce data size
- Add request caching
- Batch API calls
- Use GraphQL for precise data fetching

### Problem: High Memory Usage
**Solutions:**
- Unsubscribe from listeners
- Clean up event handlers
- Limit cache size
- Use WeakMap for large data structures

## Checklist Before Deployment

- [ ] Lighthouse score > 90
- [ ] Bundle size < 250KB (main)
- [ ] Time to interactive < 3.5s
- [ ] No console errors or warnings
- [ ] Images optimized (WebP, <100KB)
- [ ] CSS critical path optimized
- [ ] Fonts optimized and preloaded
- [ ] No unused dependencies
- [ ] Query caching configured
- [ ] Error tracking implemented
- [ ] Analytics integrated
- [ ] Performance budget defined
- [ ] Monitoring alerts configured

## Performance Budgets

Suggested budgets for Carter's Care:

```json
{
  "bundles": [
    {
      "name": "main",
      "maxSize": "250kb"
    },
    {
      "name": "vendor",
      "maxSize": "180kb"
    },
    {
      "name": "ui",
      "maxSize": "100kb"
    }
  ],
  "metrics": [
    {
      "name": "LCP",
      "limit": "2.5s"
    },
    {
      "name": "FID",
      "limit": "100ms"
    },
    {
      "name": "CLS",
      "limit": "0.1"
    }
  ]
}
```

## References

- [Web Vitals Guide](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Vite Performance Guide](https://vitejs.dev/guide/features.html#lazy-load-routes)
- [Bundle Analyzer](https://www.bundle-analyzer.com/)
