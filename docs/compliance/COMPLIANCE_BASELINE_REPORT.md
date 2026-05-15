# Carter's Care Platform - Compliance Baseline Report

**Document Version:** 1.0  
**Last Updated:** April 2025  
**Classification:** Internal - Confidential  
**Review Cycle:** Annual

---

## 1. Executive Summary

This document outlines the compliance baseline for the Carter's Care Platform, a software-as-a-service (SaaS) solution designed for Australian aged care and NDIS disability service providers.

### Compliance Scope
- Australian Privacy Principles (APPs)
- Privacy Act 1988 (Cth)
- NDIS Quality and Safeguards Framework
- Aged Care Quality Standards
- ASD Essential Eight (Level 1)
- Notifiable Data Breaches (NDB) scheme

### Platform Risk Profile
| Category | Risk Level | Mitigation Status |
|----------|------------|-------------------|
| Data Breach | Medium | Implemented |
| Unauthorised Access | Low | Implemented |
| Data Loss | Low | Implemented |
| Compliance Violation | Medium | In Progress |
| AI Governance | Low | Implemented |

---

## 2. Regulatory Framework Alignment

### 2.1 Australian Privacy Principles (APPs)

| APP | Requirement | Implementation Status |
|-----|-------------|----------------------|
| APP 1 | Open & transparent management | Privacy Policy published |
| APP 2 | Anonymity and pseudonymity | N/A - Identity required for care |
| APP 3 | Collection of solicited information | Consent management implemented |
| APP 4 | Unsolicited information | Destruction procedures defined |
| APP 5 | Notification of collection | Privacy notices at collection |
| APP 6 | Use and disclosure | RBAC + audit logging |
| APP 7 | Direct marketing | Not applicable |
| APP 8 | Cross-border disclosure | Australian hosting only |
| APP 9 | Government identifiers | Secure storage, limited use |
| APP 10 | Quality of personal information | Data validation controls |
| APP 11 | Security of personal information | Encryption + access controls |
| APP 12 | Access to personal information | User data export available |
| APP 13 | Correction of personal information | Self-service corrections |

### 2.2 NDIS Quality and Safeguards

| Requirement | Implementation |
|-------------|----------------|
| Incident Management | Digital incident reporting system |
| Worker Screening | Compliance document tracking |
| Complaints Management | In-app feedback mechanism |
| Reportable Incidents | Automated escalation workflows |
| Participant Rights | Privacy controls, data access |
| Record Keeping | Immutable audit logs |

### 2.3 ASD Essential Eight - Level 1

| Control | Status | Implementation |
|---------|--------|----------------|
| Application Control | Partial | Managed hosting restricts execution |
| Patch Applications | Compliant | Vercel/Supabase managed updates |
| Configure MS Office Macros | N/A | Web application only |
| User Application Hardening | Compliant | CSP headers, input validation |
| Restrict Admin Privileges | Compliant | RBAC with least privilege |
| Patch Operating Systems | Compliant | Managed infrastructure |
| Multi-factor Authentication | Compliant | MFA enforced for admins |
| Regular Backups | Compliant | Supabase automated backups |

---

## 3. Data Classification

### 3.1 Classification Levels

| Level | Description | Examples | Controls |
|-------|-------------|----------|----------|
| **Restricted** | Highly sensitive PII | Health records, incident details | Encryption, audit, MFA |
| **Confidential** | Business-sensitive | Staff records, rosters | Encryption, RBAC |
| **Internal** | Operational data | Timesheets, notes | RBAC, logging |
| **Public** | Non-sensitive | Company name, public policies | None required |

### 3.2 Data Inventory

| Data Type | Classification | Retention | Storage Location |
|-----------|---------------|-----------|------------------|
| Client Records | Restricted | 7 years post-service | Supabase (encrypted) |
| Incident Reports | Restricted | 7 years | Supabase (encrypted) |
| Staff PII | Confidential | Employment + 7 years | Supabase (encrypted) |
| Timesheets | Internal | 7 years | Supabase |
| Audit Logs | Confidential | 7 years minimum | Supabase (append-only) |
| Session Data | Internal | 24 hours | Memory/Cache |
| AI Interactions | Confidential | 12 months | Logged, not stored |

---

## 4. Technical Security Controls

### 4.1 Authentication & Access

- **Provider:** Supabase Auth
- **MFA:** Required for admin roles
- **Session Timeout:** 8 hours idle, 24 hours maximum
- **Password Policy:** Minimum 12 characters, complexity enforced
- **RBAC Roles:** Admin, Manager, Support Worker, Viewer

### 4.2 Encryption

| Layer | Method | Key Management |
|-------|--------|----------------|
| Data at Rest | AES-256 | Supabase managed |
| Data in Transit | TLS 1.3 | Automatic via HTTPS |
| Database | Transparent encryption | Supabase managed |
| File Storage | Server-side encryption | Supabase Storage |

### 4.3 Network Security

- Cloudflare WAF (recommended)
- DDoS protection via hosting provider
- Rate limiting on API endpoints
- CORS policy enforcement
- CSP headers implemented

---

## 5. Compliance Gaps & Remediation

| Gap | Priority | Remediation Plan | Target Date |
|-----|----------|------------------|-------------|
| Formal penetration test | Medium | Schedule annual pentest | Q2 2025 |
| Security awareness training | Medium | Implement training module | Q2 2025 |
| Vendor risk assessments | Low | Document subprocessors | Q3 2025 |
| Business continuity plan | Medium | Draft and test BCP | Q2 2025 |

---

## 6. Audit & Review Schedule

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Access review | Quarterly | Platform Admin |
| Security policy review | Annual | Management |
| Compliance assessment | Annual | External (optional) |
| Incident response drill | Annual | All staff |
| Data retention review | Quarterly | Platform Admin |

---

## 7. Attestation

This compliance baseline report has been reviewed and represents an accurate assessment of the platform's current security and compliance posture.

| Role | Name | Date |
|------|------|------|
| Platform Owner | _______________ | _______________ |
| Technical Lead | _______________ | _______________ |

---

*This document should be reviewed annually or upon significant platform changes.*
