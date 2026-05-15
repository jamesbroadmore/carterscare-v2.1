# Incident Response Plan

**Carter's Care Platform**  
**Version:** 1.0  
**Effective Date:** April 2025

---

## 1. Purpose

This plan establishes procedures for responding to security incidents affecting the Carter's Care Platform, ensuring rapid containment, appropriate escalation, and regulatory compliance.

---

## 2. Scope

This plan covers:
- Cybersecurity incidents
- Data breaches
- Service disruptions
- Suspected unauthorized access
- Malware infections
- Social engineering attempts

---

## 3. Incident Classification

### Severity Levels

| Level | Description | Examples | Response Time |
|-------|-------------|----------|---------------|
| **P1 - Critical** | Active attack, data breach confirmed | Ransomware, mass data exfiltration | Immediate |
| **P2 - High** | Potential breach, service down | Suspected intrusion, major outage | < 1 hour |
| **P3 - Medium** | Security concern, limited impact | Failed attack, minor vulnerability | < 4 hours |
| **P4 - Low** | Informational, no immediate threat | Phishing attempt blocked | < 24 hours |

---

## 4. Response Team

### Core Team

| Role | Primary | Backup | Contact |
|------|---------|--------|---------|
| Incident Commander | [Name] | [Name] | [Phone] |
| Technical Lead | [Name] | [Name] | [Phone] |
| Communications Lead | [Name] | [Name] | [Phone] |
| Privacy Officer | [Name] | [Name] | [Phone] |

### Extended Team (As Needed)

- Legal Counsel
- External Security Consultant
- Insurance Provider
- Public Relations

---

## 5. Response Phases

### Phase 1: Detection & Triage (0-30 minutes)

**Objectives:**
- Confirm incident is real
- Classify severity
- Activate response team

**Actions:**
1. [ ] Receive and log initial report
2. [ ] Verify incident (not false positive)
3. [ ] Classify severity level
4. [ ] Notify Incident Commander
5. [ ] Activate response team for P1/P2

**Detection Sources:**
- User reports
- Monitoring alerts
- Log analysis
- Third-party notification
- Media/external reports

### Phase 2: Containment (30 min - 2 hours)

**Objectives:**
- Limit damage
- Preserve evidence
- Prevent spread

**Immediate Containment (P1/P2):**
1. [ ] Isolate affected systems
2. [ ] Block malicious IPs/accounts
3. [ ] Revoke compromised credentials
4. [ ] Enable enhanced logging
5. [ ] Snapshot systems for forensics

**Short-term Containment:**
1. [ ] Patch exploited vulnerabilities
2. [ ] Implement additional monitoring
3. [ ] Restrict access as needed
4. [ ] Document all actions taken

**Evidence Preservation:**
- DO NOT delete logs
- Screenshot active sessions
- Export relevant data
- Document timeline
- Preserve memory dumps if applicable

### Phase 3: Eradication (2-24 hours)

**Objectives:**
- Remove threat
- Close vulnerabilities
- Verify clean state

**Actions:**
1. [ ] Remove malware/backdoors
2. [ ] Patch vulnerabilities
3. [ ] Reset all potentially compromised passwords
4. [ ] Review and update access controls
5. [ ] Scan for indicators of compromise
6. [ ] Verify eradication complete

### Phase 4: Recovery (1-7 days)

**Objectives:**
- Restore normal operations
- Implement improvements
- Monitor for recurrence

**Actions:**
1. [ ] Restore from clean backups if needed
2. [ ] Bring systems online gradually
3. [ ] Implement enhanced monitoring
4. [ ] Verify system integrity
5. [ ] Conduct user acceptance testing
6. [ ] Document recovery steps

**Recovery Verification:**
- All systems functional
- No signs of compromise
- User access restored
- Monitoring in place
- Stakeholders informed

### Phase 5: Post-Incident (1-4 weeks)

**Objectives:**
- Learn from incident
- Improve defenses
- Complete documentation

**Actions:**
1. [ ] Conduct post-incident review
2. [ ] Document lessons learned
3. [ ] Update security controls
4. [ ] Revise policies if needed
5. [ ] Provide staff training
6. [ ] Complete regulatory notifications
7. [ ] Archive incident documentation

---

## 6. Communication

### Internal Communication

| Audience | When | Method | Content |
|----------|------|--------|---------|
| Response Team | Immediately | Phone/Slack | Full details |
| Executive Team | P1/P2: 1hr, P3: 4hr | Email/Call | Summary + impact |
| All Staff | As needed | Email | General awareness |

### External Communication

| Audience | When | Who Approves | Content |
|----------|------|--------------|---------|
| Affected Users | Per breach plan | Privacy Officer | Notification letter |
| Regulators (OAIC) | Within 30 days | Legal/Privacy | Formal notification |
| NDIS Commission | Within 24hrs (if applicable) | Privacy Officer | Incident report |
| Media | If necessary | Executive Team | Prepared statement |
| Law Enforcement | If criminal | Legal | Incident report |

### Communication Templates

**Internal Alert:**
```
SECURITY INCIDENT ALERT - [SEVERITY]

Time: [DateTime]
Type: [Brief Description]
Status: [Investigating/Contained/Resolved]
Impact: [Systems/Data Affected]

Actions Required: [Specific instructions]

DO NOT share externally. Updates via [channel].
Contact: [Incident Commander]
```

**Customer Notification:**
```
Subject: Security Notice - [Organization Name]

Dear [Customer],

We are writing to inform you of a security incident that 
affected [scope].

What Happened: [Brief description]

What We Did: [Response actions]

What You Should Do: [Recommendations]

We take security seriously and apologize for any concern.

Questions: [Contact information]
```

---

## 7. Regulatory Notification

### OAIC (Data Breach)
- **Trigger:** Eligible data breach confirmed
- **Timeline:** As soon as practicable, max 30 days
- **Method:** OAIC online notification form
- **Content:** As per NDB scheme requirements

### NDIS Commission
- **Trigger:** Incident affecting NDIS participants
- **Timeline:** Within 24 hours
- **Method:** Commission portal
- **Content:** Incident details, affected participants

### State Regulators
- **Trigger:** Depending on data types involved
- **Timeline:** Check specific requirements
- **Method:** Per regulator guidance

---

## 8. Escalation Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                         P1 Critical                          │
│  → Incident Commander + Tech Lead + Privacy Officer          │
│  → Executive Team within 1 hour                              │
│  → Legal Counsel on standby                                  │
│  → Consider external security support                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          P2 High                             │
│  → Incident Commander + Tech Lead                            │
│  → Executive Team within 4 hours                             │
│  → Privacy Officer if data involved                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         P3 Medium                            │
│  → Tech Lead handles                                         │
│  → Report to Incident Commander                              │
│  → Standard documentation                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          P4 Low                              │
│  → Tech team handles                                         │
│  → Log for review                                            │
│  → Include in monthly report                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Tools & Resources

### Investigation Tools
- Supabase Logs
- Vercel Logs
- Cloudflare Analytics
- Browser developer tools
- Database query access

### Communication Tools
- Phone tree
- Secure messaging (Signal)
- Email (for non-urgent)
- Video conferencing

### Documentation
- Incident log template
- Timeline template
- Evidence collection checklist
- Notification templates

---

## 10. Training & Testing

### Annual Requirements
- [ ] Tabletop exercise (all response team)
- [ ] Plan review and update
- [ ] Contact list verification
- [ ] Tool access verification

### Quarterly Requirements
- [ ] Detection capability test
- [ ] Backup restoration test
- [ ] Contact list update

---

## 11. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 2025 | Security Team | Initial release |

**Approvals:**

| Role | Name | Date |
|------|------|------|
| Incident Commander | | |
| Executive Sponsor | | |

---

*This plan must be tested annually and updated as needed.*
