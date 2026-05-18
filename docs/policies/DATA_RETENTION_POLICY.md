# Data Retention & Deletion Policy

**Carters Care Platform**  
**Version:** 1.0  
**Effective Date:** April 2025

---

## 1. Purpose

This policy defines retention periods and deletion procedures for all data categories within the Carters Care Platform, ensuring compliance with Australian privacy law while meeting operational and legal requirements.

---

## 2. Retention Schedule

### 2.1 Care Records

| Data Type | Active Retention | Archive Period | Total Retention | Legal Basis |
|-----------|------------------|----------------|-----------------|-------------|
| Client profiles | Duration of care | 7 years post-service | Variable | State health records acts |
| Care plans | Duration of care | 7 years post-service | Variable | NDIS/Aged Care requirements |
| Progress notes | Duration of care | 7 years post-service | Variable | Clinical documentation |
| Incident reports | Duration of care | 7 years post-incident | Variable | NDIS Commission requirements |
| Risk assessments | Duration of care | 7 years post-service | Variable | Duty of care |

### 2.2 Staff Records

| Data Type | Active Retention | Archive Period | Total Retention | Legal Basis |
|-----------|------------------|----------------|-----------------|-------------|
| Employment records | Duration of employment | 7 years post-termination | Variable | Fair Work Act |
| Timesheets | 7 years | N/A | 7 years | Fair Work Act |
| Compliance documents | Duration + renewal | 7 years post-expiry | Variable | NDIS/screening requirements |
| Performance records | Duration of employment | 7 years post-termination | Variable | Employment law |

### 2.3 Financial Records

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Invoices | 7 years | Tax law |
| Payment records | 7 years | Tax law |
| Financial reports | 7 years | Corporate law |

### 2.4 System Records

| Data Type | Retention Period | Purpose |
|-----------|------------------|---------|
| Audit logs | 7 years | Compliance, investigation |
| Security logs | 2 years | Security monitoring |
| Access logs | 1 year | Operational |
| Error logs | 90 days | Debugging |
| Analytics | 2 years (anonymized) | Improvement |

### 2.5 Temporary Data

| Data Type | Retention Period | Notes |
|-----------|------------------|-------|
| Session data | 24 hours max | Cleared on logout |
| Upload staging | 72 hours | Pending completion |
| Cache data | 24 hours | Performance |
| AI conversation | Session only | Not persisted |

---

## 3. Data Minimization

### 3.1 Collection Principles
- Collect only what is necessary
- Avoid collecting sensitive data unless required
- Do not collect "nice to have" data
- Review collection points quarterly

### 3.2 Specific Minimization Rules
- Location data: Delete after 90 days
- Device information: Anonymize after 30 days
- Browsing behavior: Do not collect
- Health details: Only if directly relevant to care

---

## 4. Archival Process

### 4.1 Archive Triggers
Data moves to archive when:
- Client service ends
- Staff employment terminates
- Record reaches end of active period
- User requests account closure

### 4.2 Archive Characteristics
- Read-only access
- Restricted to authorized personnel
- Same encryption as active data
- Same audit logging
- Reduced backup frequency

### 4.3 Archive Access
- Legal/compliance requests only
- Management approval required
- Full audit trail maintained
- Time-limited access

---

## 5. Deletion Process

### 5.1 Scheduled Deletion
```
Weekly: Automated deletion of expired temporary data
Monthly: Review and delete expired session data
Quarterly: Review archive for deletion eligibility
Annually: Full data inventory and cleanup
```

### 5.2 Manual Deletion Requests
**User-requested deletion:**
1. Verify requester identity
2. Check legal hold status
3. Check retention requirements
4. If eligible, schedule deletion
5. Confirm deletion to user
6. Log the request and action

**Response time:** 30 days maximum

### 5.3 Deletion Methods
| Data Type | Method | Verification |
|-----------|--------|--------------|
| Database records | Soft delete → Hard delete after 30 days | Audit log |
| Files | Secure deletion + bucket cleanup | Automated verification |
| Backups | Expire naturally per backup policy | Backup logs |
| Logs | Automated expiry | System verification |

### 5.4 Deletion Exemptions
Data cannot be deleted if:
- Subject to legal hold
- Required for ongoing investigation
- Within mandatory retention period
- Part of active dispute/complaint
- Required for regulatory compliance

---

## 6. Legal Hold

### 6.1 Hold Triggers
- Litigation (actual or anticipated)
- Regulatory investigation
- Audit notification
- Serious incident investigation

### 6.2 Hold Process
1. Receive hold notice
2. Identify affected data
3. Suspend deletion for that data
4. Notify relevant parties
5. Maintain until hold lifted
6. Document hold period

### 6.3 Hold Duration
- Minimum: Until matter resolved
- Review: Every 6 months
- Release: Written authorization required

---

## 7. User Rights

### 7.1 Access Requests
Users may request:
- Copy of their personal data
- Information about how data is used
- List of disclosures

**Response time:** 30 days

### 7.2 Correction Requests
Users may request:
- Correction of inaccurate data
- Addition of missing information
- Notation of disputed information

**Response time:** 30 days

### 7.3 Deletion Requests
Users may request deletion of:
- Data no longer necessary
- Data processed without consent
- Data collected excessively

**Limitations:**
- Cannot delete if legally required to retain
- Cannot delete if needed for legal claims
- Must balance against public interest

---

## 8. Implementation

### 8.1 Technical Controls
- Automated retention policy enforcement
- Soft delete with grace period
- Archive automation
- Deletion verification
- Audit logging of all actions

### 8.2 Responsibilities

| Role | Responsibility |
|------|----------------|
| Platform Admin | Run deletion jobs, review requests |
| Privacy Officer | Approve exceptions, handle complex requests |
| Technical Team | Maintain deletion infrastructure |
| All Staff | Follow retention guidelines |

---

## 9. Monitoring & Reporting

### 9.1 Regular Reports
- Monthly: Deletion job summary
- Quarterly: Data inventory review
- Annual: Full retention compliance audit

### 9.2 Metrics
- Deletion request response time
- Archive volume growth
- Retention policy exceptions
- Legal hold count

---

## 10. Document Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2025 | Initial release |

---

*Review annually or upon regulatory changes.*
