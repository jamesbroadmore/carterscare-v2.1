# Vendor Risk Register

**Carters Care Platform**  
**Version:** 1.0  
**Last Updated:** April 2025

---

## Purpose

This register documents third-party vendors and service providers that process, store, or have access to personal information or platform infrastructure, as required by Australian Privacy Principles.

---

## Vendor Assessment Criteria

### Risk Levels

| Level | Data Access | Criteria |
|-------|-------------|----------|
| **Critical** | Stores/processes sensitive data | Database, auth, core infrastructure |
| **High** | Accesses sensitive data | Support tools, integrations |
| **Medium** | Limited data access | Analytics, monitoring |
| **Low** | No data access | CDN, static assets |

### Assessment Requirements

| Risk Level | Requirements |
|------------|--------------|
| Critical | Full security review, DPA required, annual review |
| High | Security questionnaire, DPA required, annual review |
| Medium | Basic review, DPA if personal data, biennial review |
| Low | Minimal review, standard terms acceptable |

---

## Active Vendors

### V001: Supabase

| Attribute | Value |
|-----------|-------|
| **Service** | Database, Authentication, Storage, Edge Functions |
| **Risk Level** | Critical |
| **Data Location** | Australia (Sydney region) |
| **Data Access** | Full database access |
| **Website** | supabase.com |

**Data Processed:**
- All client records
- All staff records
- Authentication credentials
- File uploads
- Audit logs

**Security Assessment:**
| Control | Status |
|---------|--------|
| Encryption at rest | ✅ AES-256 |
| Encryption in transit | ✅ TLS 1.3 |
| SOC 2 Type II | ✅ Certified |
| ISO 27001 | ✅ Certified |
| Data residency | ✅ Australian region available |
| Backup & recovery | ✅ Daily, 30-day retention |
| MFA available | ✅ Yes |

**Contractual Protections:**
- [x] Data Processing Agreement
- [x] Australian data residency confirmed
- [x] Security certifications current
- [x] Breach notification clause

**Last Review:** April 2025  
**Next Review:** April 2026

---

### V002: Vercel

| Attribute | Value |
|-----------|-------|
| **Service** | Frontend Hosting, Edge Functions |
| **Risk Level** | Medium |
| **Data Location** | Global CDN (configurable) |
| **Data Access** | Application code, environment variables |
| **Website** | vercel.com |

**Data Processed:**
- Frontend application code
- Environment configuration
- Access logs (IP, user agent)

**Security Assessment:**
| Control | Status |
|---------|--------|
| Encryption in transit | ✅ TLS 1.3 |
| SOC 2 Type II | ✅ Certified |
| DDoS protection | ✅ Built-in |
| Edge security | ✅ WAF available |

**Contractual Protections:**
- [x] Standard terms acceptable (no sensitive data stored)
- [x] Security certifications current
- [x] GDPR compliant

**Last Review:** April 2025  
**Next Review:** April 2026

---

### V003: Cloudflare (Recommended)

| Attribute | Value |
|-----------|-------|
| **Service** | WAF, DDoS Protection, CDN |
| **Risk Level** | Low |
| **Data Location** | Global edge network |
| **Data Access** | Traffic metadata only |
| **Website** | cloudflare.com |

**Data Processed:**
- Traffic metadata
- IP addresses
- Request headers

**Security Assessment:**
| Control | Status |
|---------|--------|
| SOC 2 Type II | ✅ Certified |
| ISO 27001 | ✅ Certified |
| Privacy Shield | ✅ Certified |
| Data minimization | ✅ Processes traffic only |

**Contractual Protections:**
- [x] DPA available
- [x] Australian data processing options

**Last Review:** April 2025  
**Next Review:** April 2026

---

### V004: AI/LLM Provider (If Applicable)

| Attribute | Value |
|-----------|-------|
| **Service** | AI Chat Assistant |
| **Risk Level** | Medium |
| **Data Location** | [To be confirmed] |
| **Data Access** | Query content |
| **Website** | [Provider URL] |

**Data Processed:**
- User queries (anonymized)
- Generated responses

**Security Requirements:**
| Control | Required |
|---------|----------|
| No training on our data | ✅ Required |
| Data not retained | ✅ Required |
| Australian processing | ⚡ Preferred |
| DPA | ✅ Required |

**Contractual Protections:**
- [ ] Data Processing Agreement
- [ ] No training clause
- [ ] Data retention limits

**Status:** [Under Review]

---

## Pending Assessments

| Vendor | Service | Status | Due Date |
|--------|---------|--------|----------|
| [None] | - | - | - |

---

## Retired Vendors

| Vendor | Service | Retired Date | Data Confirmation |
|--------|---------|--------------|-------------------|
| [None] | - | - | - |

---

## Review Schedule

| Vendor | Risk Level | Next Review |
|--------|------------|-------------|
| Supabase | Critical | April 2026 |
| Vercel | Medium | April 2026 |
| Cloudflare | Low | April 2026 |

---

## Data Processing Agreements

| Vendor | DPA Status | DPA Location |
|--------|------------|--------------|
| Supabase | ✅ Executed | [Link/File Reference] |
| Vercel | ✅ Standard Terms | vercel.com/legal |
| Cloudflare | ✅ Available | cloudflare.com/gdpr |

---

## Subprocessor Management

Each critical vendor's subprocessors:

### Supabase Subprocessors
- AWS (Infrastructure)
- Stripe (Billing)
- [Full list at supabase.com/legal/subprocessors]

### Vercel Subprocessors
- AWS (Infrastructure)
- [Full list at vercel.com/legal/subprocessors]

---

## Incident History

| Date | Vendor | Incident | Impact | Resolution |
|------|--------|----------|--------|------------|
| - | - | No incidents recorded | - | - |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 2025 | Privacy Officer | Initial register |

---

*Review quarterly or when adding new vendors.*
