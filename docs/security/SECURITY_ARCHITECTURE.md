# Security Architecture Document

**Carters Care Platform**  
**Version:** 1.0  
**Classification:** Confidential  
**Last Updated:** April 2025

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (WAF + DDoS + CDN)                        │
│  • Rate Limiting  • Bot Protection  • SSL Termination  • Edge Caching   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────────┐
│         VERCEL                │   │           SUPABASE                │
│   (Frontend Hosting)          │   │     (Backend Services)            │
│                               │   │                                   │
│  • React SPA                  │   │  ┌─────────────────────────────┐  │
│  • Static Assets              │   │  │     Auth Service            │  │
│  • Edge Functions             │   │  │  • JWT Tokens               │  │
│  • Automatic HTTPS            │   │  │  • MFA Support              │  │
│                               │   │  │  • Session Management       │  │
└───────────────────────────────┘   │  └─────────────────────────────┘  │
                                    │                                   │
                                    │  ┌─────────────────────────────┐  │
                                    │  │     PostgreSQL Database     │  │
                                    │  │  • Row Level Security       │  │
                                    │  │  • Encrypted at Rest        │  │
                                    │  │  • Automated Backups        │  │
                                    │  └─────────────────────────────┘  │
                                    │                                   │
                                    │  ┌─────────────────────────────┐  │
                                    │  │     Storage Service         │  │
                                    │  │  • Encrypted Files          │  │
                                    │  │  • Signed URLs              │  │
                                    │  │  • Access Policies          │  │
                                    │  └─────────────────────────────┘  │
                                    │                                   │
                                    │  ┌─────────────────────────────┐  │
                                    │  │     Edge Functions          │  │
                                    │  │  • API Logic                │  │
                                    │  │  • Webhooks                 │  │
                                    │  └─────────────────────────────┘  │
                                    └───────────────────────────────────┘
```

---

## 2. Security Layers

### 2.1 Perimeter Security (Cloudflare)

| Control | Implementation |
|---------|----------------|
| WAF Rules | OWASP Top 10 protection |
| Rate Limiting | 100 req/min per IP |
| DDoS Protection | Automatic mitigation |
| Bot Protection | Challenge suspicious traffic |
| SSL/TLS | TLS 1.3, HSTS enabled |
| IP Blocking | Automated + manual blocklists |

### 2.2 Application Security (Frontend)

| Control | Implementation |
|---------|----------------|
| Content Security Policy | Strict CSP headers |
| XSS Protection | Input sanitization, React escaping |
| CSRF Protection | SameSite cookies, tokens |
| Clickjacking | X-Frame-Options: DENY |
| Input Validation | Client + server-side |
| Dependency Scanning | Automated via CI/CD |

### 2.3 Authentication Security (Supabase Auth)

| Control | Implementation |
|---------|----------------|
| Password Hashing | bcrypt (cost factor 10) |
| MFA | TOTP-based, required for admins |
| Session Tokens | JWT with short expiry |
| Refresh Tokens | Secure, rotated on use |
| Account Lockout | After 5 failed attempts |
| Password Policy | 12+ chars, complexity required |

### 2.4 Data Security (Supabase Database)

| Control | Implementation |
|---------|----------------|
| Encryption at Rest | AES-256 (Supabase managed) |
| Encryption in Transit | TLS 1.3 |
| Row Level Security | Enabled on all tables |
| Query Parameterization | Prevents SQL injection |
| Backup Encryption | Encrypted backups |
| Connection Security | SSL required |

### 2.5 File Storage Security

| Control | Implementation |
|---------|----------------|
| Bucket Policies | Private by default |
| Signed URLs | Time-limited access |
| File Validation | Type and size checks |
| Malware Scanning | Recommended integration |
| Access Logging | All file access logged |

---

## 3. Data Flow Diagrams

### 3.1 Authentication Flow
```
User → [HTTPS] → Cloudflare → Vercel → Supabase Auth
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │ Verify Creds  │
                                    │ Check MFA     │
                                    │ Issue JWT     │
                                    └───────────────┘
                                            │
                                            ▼
                              JWT returned to client
                              (stored in secure cookie)
```

### 3.2 Data Access Flow
```
Authenticated Request
        │
        ▼
┌───────────────────┐
│  JWT Validation   │
│  (Supabase Auth)  │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  RLS Policy Check │
│  (user_id match)  │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Query Execution  │
│  + Audit Log      │
└───────────────────┘
        │
        ▼
   Response to User
```

### 3.3 Sensitive Data Flow
```
Client Data Entry
        │
        ▼
┌───────────────────┐     ┌───────────────────┐
│  Input Validation │ →   │  Sanitization     │
└───────────────────┘     └───────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │  TLS Encrypted Transport  │
                    └───────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │  Database (Encrypted)     │
                    │  + Audit Log Entry        │
                    └───────────────────────────┘
```

---

## 4. Access Control Matrix

### 4.1 Role Definitions

| Role | Description | Count Limit |
|------|-------------|-------------|
| **Super Admin** | Platform owner, full access | 2 max |
| **Admin** | Organization admin, manage users/data | Per org |
| **Manager** | View team, approve timesheets | Per org |
| **Support Worker** | Own data, assigned clients | Per org |
| **Viewer** | Read-only access | Per org |

### 4.2 Permission Matrix

| Resource | Super Admin | Admin | Manager | Worker | Viewer |
|----------|-------------|-------|---------|--------|--------|
| All Clients | CRUD | CRUD | Read | Assigned | Read |
| All Staff | CRUD | CRUD | Read | Self | None |
| Client Notes | CRUD | CRUD | Read | Create | Read |
| Incidents | CRUD | CRUD | Read | Create | Read |
| Timesheets | CRUD | CRUD | Approve | Own | None |
| Invoices | CRUD | CRUD | Read | Own | None |
| Settings | CRUD | CRUD | None | None | None |
| Audit Logs | Read | Read | None | None | None |

### 4.3 Row Level Security (RLS) Rules

```sql
-- Example: Staff can only see their own timesheets
CREATE POLICY "Users view own timesheets" ON timesheets
  FOR SELECT USING (auth.uid() = user_id);

-- Example: Admins can see all org data
CREATE POLICY "Admins view org data" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND org_id = clients.org_id
    )
  );
```

---

## 5. Audit Logging

### 5.1 Events Logged

| Category | Events |
|----------|--------|
| Authentication | Login, logout, MFA, password change, failed attempts |
| Data Access | View, create, update, delete (sensitive tables) |
| Admin Actions | User management, role changes, settings |
| File Operations | Upload, download, delete |
| API Calls | External integrations |
| Security Events | Permission denied, anomalies |

### 5.2 Log Schema

```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "user_id": "uuid",
  "action": "string",
  "resource_type": "string",
  "resource_id": "uuid",
  "ip_address": "string",
  "user_agent": "string",
  "details": {},
  "risk_level": "low|medium|high"
}
```

### 5.3 Log Retention

| Log Type | Retention |
|----------|-----------|
| Security Events | 7 years |
| Data Access | 7 years |
| Authentication | 2 years |
| API Logs | 1 year |
| Error Logs | 90 days |

---

## 6. Incident Detection

### 6.1 Monitoring Alerts

| Alert | Threshold | Action |
|-------|-----------|--------|
| Failed Logins | >5 in 5 min | Lock account, notify |
| Bulk Data Export | >100 records | Log, review |
| Off-hours Access | Outside 6am-10pm | Log, flag |
| New Admin Added | Any | Notify all admins |
| Permission Escalation | Any | Notify, require approval |

### 6.2 Anomaly Detection

- Unusual access patterns
- Geographic anomalies
- Bulk operations
- Privilege escalation attempts

---

## 7. Vulnerability Management

### 7.1 Dependency Updates

| Component | Update Frequency | Method |
|-----------|------------------|--------|
| Frontend NPM | Weekly | Dependabot |
| Backend | Managed by Supabase | Automatic |
| Infrastructure | Managed by providers | Automatic |

### 7.2 Security Testing

| Test Type | Frequency | Provider |
|-----------|-----------|----------|
| Dependency Scan | Continuous | GitHub/Snyk |
| SAST | On commit | CodeQL |
| Penetration Test | Annual | External |

---

## 8. Disaster Recovery

### 8.1 Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Database | Daily | 30 days | Supabase (geo-redundant) |
| File Storage | Continuous | Versioned | Supabase Storage |
| Configs | On change | Indefinite | Git repository |

### 8.2 Recovery Objectives

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | 24 hours |
| RTO (Recovery Time Objective) | 4 hours |

---

## 9. Compliance Mapping

| Control | APP | NDIS QS | E8 |
|---------|-----|---------|-----|
| Encryption | APP 11 | ✓ | ✓ |
| Access Control | APP 6 | ✓ | ✓ |
| MFA | APP 11 | ✓ | ✓ |
| Audit Logging | APP 11 | ✓ | ✓ |
| Backups | APP 11 | ✓ | ✓ |
| Breach Response | APP 11 | ✓ | - |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 2025 | Technical Lead | Initial release |

---

*Review annually or upon significant architecture changes.*
