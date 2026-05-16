# Security Guidelines

This document outlines security best practices and implementation details for the Carter's Care application.

## Authentication & Sessions

### Current Implementation
- Supabase Auth with localStorage token storage
- Auto-refresh tokens enabled
- Role-based access control (Admin, Moderator, User)

### Production Recommendations
- For sensitive care data, consider migrating to HTTP-only cookies instead of localStorage
- This requires backend session management to prevent XSS token theft
- Implement proper CORS policies to restrict which domains can access the API

```typescript
// Example: Configure Supabase with HTTP-only cookies
supabase.auth.onAuthStateChange(async (event, session) => {
  // Session tokens should be in HTTP-only cookies, not localStorage
});
```

## CSRF Protection
- All state-changing operations (POST, PUT, DELETE) should validate CSRF tokens
- Implement SameSite cookie policy for Supabase auth cookies
- Add `Vary: Cookie` header to responses

## Data Security

### Row Level Security (RLS)
All tables in Supabase should have RLS policies enabled:
- Users can only access their own data
- Admins can access all organization data
- Moderators have limited permissions

### Database Best Practices
- Never use raw SQL queries - always use parameterized queries via Supabase client
- Implement audit logs for sensitive operations
- Regular database backups (handled by Supabase automatically)

## Environment Variables
- **Never** commit `.env.local` or `.env` files to version control
- Use `.env.example` as a template for required variables
- In CI/CD pipelines, inject env vars through secure vaults (GitHub Secrets, Vercel env vars, etc.)

## Secrets Management
- Supabase publishable key is public - it's safe to expose in the browser
- Service role key (if used) must remain secret and only on backend
- API keys for external services must be stored in backend environment variables

## Compliance

### NDIS & Aged Care Data
This application handles sensitive care information:
- Implement comprehensive audit logs
- Ensure HIPAA/PIPEDA compliance
- Regular penetration testing recommended
- Data retention policies must be defined and enforced

### PII (Personally Identifiable Information)
All staff and client data is sensitive:
- Implement field-level encryption for highly sensitive data
- Use parameterized queries to prevent SQL injection
- Regular security audits of data access patterns

## Common Vulnerabilities

### XSS (Cross-Site Scripting)
- React automatically escapes content in JSX
- Be careful with `dangerouslySetInnerHTML` - sanitize HTML if used
- Content Security Policy (CSP) headers recommended

### SQL Injection
- Use Supabase client methods - never raw SQL
- All queries are parameterized through the SDK

### CSRF
- Implement token validation for state-changing operations
- Use SameSite cookie policy

## Dependency Security
- Run `npm audit` regularly to check for vulnerabilities
- Keep dependencies updated
- Review security advisories for major dependencies

## Monitoring & Logging
- Log authentication failures
- Monitor for suspicious access patterns
- Implement rate limiting on authentication endpoints
- Use Supabase's built-in security features (Auth webhooks, RLS policies)

## Incident Response
1. Identify the scope of the breach
2. Contain the incident (reset tokens, disable accounts if needed)
3. Document what happened
4. Notify affected users if required by regulations
5. Implement remediation measures

## Security Checklist for Deployment
- [ ] All environment variables are set correctly
- [ ] CORS is properly configured
- [ ] RLS policies are enabled on all tables
- [ ] SSL/TLS certificates are valid
- [ ] Security headers are configured (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Rate limiting is enabled
- [ ] Audit logging is active
- [ ] Backups are tested and working
- [ ] Monitoring is configured
- [ ] Security training for team completed

## Reporting Security Issues
If you discover a security vulnerability, please email security@carterscare.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested remediation

**Do not** publicly disclose security vulnerabilities until they have been addressed.
