# Risk Register

**Carters Care Platform**  
**Version:** 1.0  
**Last Updated:** April 2025  
**Review Cycle:** Quarterly

---

## Risk Assessment Matrix

### Likelihood Scale
| Level | Description | Probability |
|-------|-------------|-------------|
| 1 - Rare | May occur in exceptional circumstances | <5% |
| 2 - Unlikely | Could occur but not expected | 5-20% |
| 3 - Possible | Might occur at some time | 20-50% |
| 4 - Likely | Will probably occur | 50-80% |
| 5 - Almost Certain | Expected to occur | >80% |

### Impact Scale
| Level | Description | Business Impact |
|-------|-------------|-----------------|
| 1 - Negligible | Minor inconvenience | <$1,000 |
| 2 - Minor | Limited disruption | $1,000-$10,000 |
| 3 - Moderate | Significant disruption | $10,000-$50,000 |
| 4 - Major | Serious damage | $50,000-$250,000 |
| 5 - Catastrophic | Business threatening | >$250,000 |

### Risk Rating
| Rating | Score | Action |
|--------|-------|--------|
| Critical | 20-25 | Immediate action required |
| High | 12-19 | Priority action required |
| Medium | 6-11 | Action required |
| Low | 1-5 | Monitor and review |

---

## Active Risks

### R001: Data Breach - Unauthorized Access

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **Description** | Unauthorized access to client or staff personal information |
| **Likelihood** | 2 - Unlikely |
| **Impact** | 5 - Catastrophic |
| **Risk Score** | 10 (Medium) |
| **Owner** | Technical Lead |

**Current Controls:**
- Role-based access control
- Multi-factor authentication
- Encryption at rest and in transit
- Audit logging
- Row-level security

**Additional Mitigations:**
- Annual penetration testing
- Security awareness training
- Regular access reviews

**Status:** Monitored

---

### R002: Service Outage

| Attribute | Value |
|-----------|-------|
| **Category** | Operational |
| **Description** | Platform unavailable affecting service delivery |
| **Likelihood** | 2 - Unlikely |
| **Impact** | 4 - Major |
| **Risk Score** | 8 (Medium) |
| **Owner** | Technical Lead |

**Current Controls:**
- Managed hosting (Vercel, Supabase)
- Automated failover
- Daily backups
- Monitoring alerts

**Additional Mitigations:**
- Document manual fallback procedures
- Test disaster recovery annually
- Multi-region consideration

**Status:** Monitored

---

### R003: Regulatory Non-Compliance

| Attribute | Value |
|-----------|-------|
| **Category** | Compliance |
| **Description** | Failure to meet privacy or sector-specific requirements |
| **Likelihood** | 2 - Unlikely |
| **Impact** | 4 - Major |
| **Risk Score** | 8 (Medium) |
| **Owner** | Privacy Officer |

**Current Controls:**
- Privacy policy published
- Data retention controls
- Consent management
- Audit trails
- Compliance documentation

**Additional Mitigations:**
- Annual compliance review
- Staff training program
- External audit (optional)

**Status:** Monitored

---

### R004: Third-Party Provider Failure

| Attribute | Value |
|-----------|-------|
| **Category** | Operational |
| **Description** | Critical vendor (Supabase, Vercel) experiences major incident |
| **Likelihood** | 1 - Rare |
| **Impact** | 4 - Major |
| **Risk Score** | 4 (Low) |
| **Owner** | Technical Lead |

**Current Controls:**
- Reputable providers selected
- Provider status monitoring
- Regular backups
- Export capabilities

**Additional Mitigations:**
- Document portability plan
- Maintain backup export schedule
- Monitor provider communications

**Status:** Accepted

---

### R005: AI-Generated Harmful Content

| Attribute | Value |
|-----------|-------|
| **Category** | Operational |
| **Description** | AI assistant provides incorrect or harmful guidance |
| **Likelihood** | 2 - Unlikely |
| **Impact** | 3 - Moderate |
| **Risk Score** | 6 (Medium) |
| **Owner** | Product Owner |

**Current Controls:**
- AI limited to help content
- No clinical advice permitted
- Human oversight required
- Response logging
- User feedback mechanism

**Additional Mitigations:**
- Regular response review
- Clear disclaimers
- Easy human escalation

**Status:** Monitored

---

### R006: Staff Device Compromise

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **Description** | Staff device infected with malware or compromised |
| **Likelihood** | 3 - Possible |
| **Impact** | 3 - Moderate |
| **Risk Score** | 9 (Medium) |
| **Owner** | Operations Manager |

**Current Controls:**
- MFA for authentication
- Session timeout
- No local data storage
- HTTPS only

**Additional Mitigations:**
- Device policy for staff
- Security awareness training
- Consider MDM for future

**Status:** Monitored

---

### R007: Insider Threat

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **Description** | Authorized user misuses access or exfiltrates data |
| **Likelihood** | 2 - Unlikely |
| **Impact** | 4 - Major |
| **Risk Score** | 8 (Medium) |
| **Owner** | Operations Manager |

**Current Controls:**
- Role-based access (least privilege)
- Audit logging
- Background checks for staff
- Confidentiality agreements

**Additional Mitigations:**
- Regular access reviews
- Anomaly monitoring
- Clear acceptable use policy

**Status:** Monitored

---

### R008: Data Loss

| Attribute | Value |
|-----------|-------|
| **Category** | Operational |
| **Description** | Accidental deletion or corruption of data |
| **Likelihood** | 2 - Unlikely |
| **Impact** | 4 - Major |
| **Risk Score** | 8 (Medium) |
| **Owner** | Technical Lead |

**Current Controls:**
- Daily automated backups
- 30-day retention
- Soft delete (grace period)
- Point-in-time recovery

**Additional Mitigations:**
- Quarterly backup test
- Export to secondary location
- Deletion confirmation workflows

**Status:** Monitored

---

### R009: Social Engineering Attack

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **Description** | Staff tricked into revealing credentials or data |
| **Likelihood** | 3 - Possible |
| **Impact** | 3 - Moderate |
| **Risk Score** | 9 (Medium) |
| **Owner** | Operations Manager |

**Current Controls:**
- MFA (prevents credential-only attacks)
- Security awareness in onboarding
- Password manager recommendation

**Additional Mitigations:**
- Phishing simulation exercises
- Regular security reminders
- Incident reporting process

**Status:** Monitored

---

### R010: API/Integration Vulnerability

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **Description** | Vulnerability in API or third-party integration exploited |
| **Likelihood** | 2 - Unlikely |
| **Impact** | 3 - Moderate |
| **Risk Score** | 6 (Medium) |
| **Owner** | Technical Lead |

**Current Controls:**
- Input validation
- Parameterized queries
- Rate limiting
- Dependency scanning
- HTTPS everywhere

**Additional Mitigations:**
- Regular security testing
- Prompt patching
- API monitoring

**Status:** Monitored

---

## Risk Trends

| Quarter | Critical | High | Medium | Low | Total |
|---------|----------|------|--------|-----|-------|
| Q2 2025 | 0 | 0 | 8 | 2 | 10 |

---

## Accepted Risks

| Risk ID | Description | Reason for Acceptance | Review Date |
|---------|-------------|----------------------|-------------|
| R004 | Third-party provider failure | Cost of mitigation exceeds risk; reputable providers | Oct 2025 |

---

## Review History

| Date | Reviewer | Changes |
|------|----------|---------|
| April 2025 | [Name] | Initial register created |

---

## Next Review

**Date:** July 2025  
**Reviewer:** Risk Owner

---

*This register should be reviewed quarterly and updated when significant changes occur.*
