# Essential Eight Alignment Checklist

**Carters Care Platform**  
**Assessment Date:** April 2025  
**Target Maturity Level:** Level 1

---

## Overview

The Essential Eight is a set of baseline mitigation strategies from the Australian Signals Directorate (ASD) designed to help organisations protect against cyber threats. This checklist assesses the Carters Care Platform against Essential Eight Level 1 requirements.

---

## Assessment Summary

| Control | Level 1 Required | Current Status | Gap |
|---------|------------------|----------------|-----|
| Application Control | Basic | Partial | Low |
| Patch Applications | Within 1 month | Compliant | None |
| Configure MS Office Macros | N/A | N/A | N/A |
| User Application Hardening | Basic | Compliant | None |
| Restrict Admin Privileges | Basic | Compliant | None |
| Patch Operating Systems | Within 1 month | Compliant | None |
| Multi-factor Authentication | For privileged | Compliant | None |
| Regular Backups | Basic | Compliant | None |

**Overall Assessment:** ✅ Level 1 Aligned (with managed infrastructure)

---

## Detailed Assessment

### 1. Application Control

**Requirement:** Prevent execution of unapproved programs

**Level 1 Requirements:**
- [ ] Application control on workstations
- [x] Limited execution on servers (managed hosting)

**Implementation:**
- Web application runs on managed hosting (Vercel, Supabase)
- No user-executable code on servers
- Client-side code is controlled via deployment pipeline
- No desktop application component

**Status:** ✅ Compliant (via managed infrastructure)

**Evidence:**
- Vercel deployment logs
- Supabase Edge Function configurations

---

### 2. Patch Applications

**Requirement:** Patch applications within one month of release

**Level 1 Requirements:**
- [x] Internet-facing apps patched promptly
- [x] Known vulnerabilities addressed

**Implementation:**
- Frontend dependencies: Dependabot automated PRs
- Backend: Supabase managed (automatic updates)
- Third-party integrations: Provider managed

**Status:** ✅ Compliant

**Evidence:**
- Dependabot configuration
- Supabase infrastructure documentation
- package.json update history

---

### 3. Configure Microsoft Office Macros

**Requirement:** Block macros from internet, allow only signed macros

**Level 1 Requirements:**
- Not applicable (no Office integration)

**Implementation:**
- Platform is web-based only
- No Office document processing
- File uploads restricted to PDFs and images

**Status:** ✅ N/A

---

### 4. User Application Hardening

**Requirement:** Harden web browsers and applications

**Level 1 Requirements:**
- [x] Web browsers block ads (user responsibility)
- [x] Web browsers block Java (not used)
- [x] Disable unneeded features

**Implementation:**
- Application does not use Flash, Java, or ActiveX
- Strict Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

**Status:** ✅ Compliant

**Evidence:**
- HTTP response headers
- CSP configuration
- Security header scan results

---

### 5. Restrict Administrative Privileges

**Requirement:** Limit admin accounts, no internet/email from admin

**Level 1 Requirements:**
- [x] Privileged accounts documented
- [x] Admin access is separate from daily use
- [x] Privileged access is logged

**Implementation:**
- Role-based access control (RBAC)
- Separate admin role from standard user
- Admin actions logged in audit trail
- Maximum 2 super admin accounts
- Admin access requires MFA

**Status:** ✅ Compliant

**Evidence:**
- Role definitions in codebase
- Audit log schema
- User role assignments

---

### 6. Patch Operating Systems

**Requirement:** Patch OS within one month of release

**Level 1 Requirements:**
- [x] Server OS patched promptly
- [x] Workstation OS guidance provided

**Implementation:**
- Server infrastructure: Fully managed by Vercel/Supabase
- Automatic patching by providers
- No self-managed servers

**Staff Guidance:**
- Enable automatic OS updates on work devices
- Install security patches within 2 weeks

**Status:** ✅ Compliant

**Evidence:**
- Provider SLAs for patching
- Staff device policy

---

### 7. Multi-factor Authentication

**Requirement:** MFA for privileged access and remote access

**Level 1 Requirements:**
- [x] MFA for privileged users
- [x] MFA for remote access to sensitive systems

**Implementation:**
- Supabase Auth with MFA support
- MFA required for Admin and Super Admin roles
- MFA recommended for all users
- TOTP-based authentication

**Configuration:**
```
Admin roles: MFA mandatory
Manager roles: MFA recommended
Worker roles: MFA optional (recommended)
```

**Status:** ✅ Compliant

**Evidence:**
- Supabase Auth configuration
- Role-based MFA enforcement
- MFA enrollment records

---

### 8. Regular Backups

**Requirement:** Backups performed, tested, and stored securely

**Level 1 Requirements:**
- [x] Important data backed up
- [x] Backups stored disconnected
- [x] Backups tested

**Implementation:**
- Supabase automated daily backups
- 30-day backup retention
- Backups encrypted at rest
- Point-in-time recovery available
- Geo-redundant storage

**Recovery Testing:**
- Quarterly backup restoration test
- Document restoration procedures

**Status:** ✅ Compliant

**Evidence:**
- Supabase backup configuration
- Backup retention settings
- Recovery test logs

---

## Gap Remediation Plan

### Low Priority Gaps

| Gap | Remediation | Timeline | Owner |
|-----|-------------|----------|-------|
| Staff device policy enforcement | Implement MDM or policy attestation | Q3 2025 | IT |
| Formal pen test | Schedule annual test | Q2 2025 | Security |

---

## Recommendations for Level 2

To progress toward Level 2 maturity:

1. **Application Control:** Implement application allowlisting on staff devices
2. **Patching:** Reduce patch window to 2 weeks
3. **Admin Privileges:** Implement privileged access workstations
4. **MFA:** Enforce MFA for all users
5. **Backups:** Test recovery monthly

---

## Staff Device Guidelines

For staff accessing the platform, recommend:

1. **Operating System**
   - Windows: Enable automatic updates
   - macOS: Enable automatic updates
   - Keep OS within supported versions

2. **Antivirus**
   - Windows Defender (built-in) is sufficient
   - Keep definitions current

3. **Encryption**
   - Enable BitLocker (Windows) or FileVault (macOS)
   - Encrypt mobile devices

4. **Password Manager**
   - Use approved password manager (1Password, Bitwarden)
   - Unique passwords per account

5. **MFA**
   - Enable MFA on platform account
   - Use authenticator app (not SMS)

---

## Certification Statement

This assessment confirms the Carters Care Platform architecture aligns with ASD Essential Eight Level 1 requirements through use of managed cloud infrastructure and appropriate security controls.

**Assessed by:** [Name]  
**Date:** April 2025  
**Next Review:** April 2026

---

## Appendix: Evidence Index

| Item | Location | Description |
|------|----------|-------------|
| E8-1 | Vercel dashboard | Deployment configuration |
| E8-2 | package.json | Dependency versions |
| E8-3 | Response headers | Security headers scan |
| E8-4 | Supabase dashboard | Auth configuration |
| E8-5 | Codebase | RBAC implementation |
| E8-6 | Supabase dashboard | Backup configuration |
| E8-7 | Audit logs | Sample admin action logs |

---

*This checklist should be reviewed annually or when significant changes occur.*
