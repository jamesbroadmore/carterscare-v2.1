# AI Governance Policy

**Carters Care Platform**  
**Version:** 1.0  
**Effective Date:** April 2025  
**Classification:** Internal

---

## 1. Purpose

This policy establishes governance requirements for artificial intelligence (AI) and machine learning (ML) features within the Carters Care Platform, ensuring ethical use, human oversight, and regulatory compliance in the aged care and disability services context.

---

## 2. Scope

This policy applies to all AI/ML features including:
- AI-assisted chat (Maureen)
- Automated suggestions and recommendations
- Natural language processing
- Predictive analytics
- Any future AI/ML implementations

---

## 3. Core Principles

### 3.1 Human Oversight First
All AI features operate as **decision support tools only**. No AI system has authority to:
- Make care decisions
- Approve or deny services
- Change participant records without human confirmation
- Authorize financial transactions
- Override safety protocols

### 3.2 Transparency
- Users are clearly informed when interacting with AI
- AI-generated content is labeled
- Explanations are available for AI suggestions
- Limitations are communicated

### 3.3 Safety
- AI features fail safely to manual processes
- Critical functions have non-AI fallbacks
- Emergency features never rely solely on AI

### 3.4 Privacy
- AI processing minimizes data collection
- AI does not store conversation history permanently
- Personal information is not used to train external models
- Data processing complies with APP requirements

---

## 4. AI Feature Categories

### Category A: Low Risk - Information Only
**Examples:** Help text, FAQs, general guidance

**Controls:**
- Standard logging
- User feedback mechanism
- Quarterly review

### Category B: Medium Risk - Workflow Assistance
**Examples:** Form auto-fill suggestions, scheduling recommendations

**Controls:**
- Human confirmation required
- Audit logging of suggestions
- Monthly accuracy review
- Easy override capability

### Category C: High Risk - Care-Related Assistance
**Examples:** Care plan suggestions, risk assessment inputs

**Controls:**
- Explicit human approval required
- Full audit trail
- Clinical/qualified staff review
- Weekly accuracy monitoring
- Mandatory override capability
- Incident reporting for errors

---

## 5. Maureen AI Assistant Governance

### 5.1 Permitted Functions
- Answer platform usage questions
- Provide policy/procedure guidance
- Explain compliance requirements
- Direct users to relevant features
- Provide general care sector information

### 5.2 Prohibited Functions
- Provide specific clinical advice
- Make care recommendations for individuals
- Access or reveal other users' data
- Make decisions on behalf of users
- Override security controls

### 5.3 Technical Controls
- Context limited to platform help
- No access to personal care records
- Session-based only (no history retention)
- Rate limited to prevent abuse
- Response logging for quality assurance

### 5.4 Escalation
When Maureen cannot help:
1. Acknowledge limitation
2. Direct to human support
3. Provide contact information
4. Log for improvement review

---

## 6. Data Handling

### 6.1 Input Data
- Minimize personal information in AI queries
- Do not include identifying details in prompts
- Sanitize inputs before AI processing

### 6.2 Output Data
- Review AI outputs before display
- Filter inappropriate content
- Validate factual claims where possible
- Add disclaimers to generated content

### 6.3 Storage
| Data Type | Retention | Purpose |
|-----------|-----------|---------|
| Query logs | 12 months | Quality assurance |
| Response logs | 12 months | Audit & improvement |
| User feedback | 24 months | Training & review |
| Error logs | 6 months | Debugging |

---

## 7. Quality Assurance

### 7.1 Monitoring Metrics
| Metric | Target | Review Frequency |
|--------|--------|------------------|
| User satisfaction | >80% | Monthly |
| Escalation rate | <20% | Weekly |
| Error rate | <5% | Weekly |
| Response relevance | >90% | Monthly |

### 7.2 Review Process
1. **Weekly:** Review escalated queries
2. **Monthly:** Analyze satisfaction scores
3. **Quarterly:** Full quality audit
4. **Annually:** Policy and accuracy review

### 7.3 Improvement Cycle
```
Monitor → Identify Issues → Update Guidance → Test → Deploy → Monitor
```

---

## 8. Incident Management

### 8.1 AI Incident Types
| Type | Example | Response |
|------|---------|----------|
| **Harmful Output** | Inappropriate advice | Immediate disable, investigate |
| **Privacy Leak** | Reveals user data | Immediate disable, breach process |
| **Factual Error** | Incorrect policy info | Log, correct, review |
| **Bias Detected** | Discriminatory response | Investigate, retrain if needed |
| **System Failure** | AI unavailable | Fallback to manual help |

### 8.2 Reporting
All AI incidents must be:
1. Logged immediately
2. Reported to Platform Administrator
3. Reviewed within 24 hours
4. Remediated and documented
5. Included in quality reports

---

## 9. Staff Requirements

### 9.1 Training
All staff using AI features must complete:
- AI awareness training (annual)
- Platform-specific AI feature training
- Understanding AI limitations

### 9.2 Responsibilities
| Role | Responsibility |
|------|----------------|
| All Users | Report issues, maintain human oversight |
| Managers | Monitor team AI usage, review incidents |
| Admins | Configure AI settings, review logs |
| Platform Owner | Policy approval, compliance oversight |

---

## 10. Vendor Management

### 10.1 AI Service Providers
Any third-party AI services must:
- Process data in Australia (or approved jurisdiction)
- Not use our data for model training
- Provide data processing agreements
- Meet security requirements
- Support audit requirements

### 10.2 Current Providers
| Provider | Service | Data Location | DPA |
|----------|---------|---------------|-----|
| [Provider] | LLM API | [Location] | Yes |

---

## 11. Regulatory Alignment

### 11.1 Privacy Act Compliance
- AI processing meets APP requirements
- Data minimization in AI features
- Transparency about AI use
- User rights maintained

### 11.2 NDIS Considerations
- AI does not replace required human judgment
- Participant consent for AI features
- Documentation of AI-assisted decisions

### 11.3 Aged Care Considerations
- Clinical decisions require qualified staff
- AI supplements, not replaces, care assessment
- Family/representative informed of AI use

---

## 12. Future AI Features

### 12.1 Approval Process
New AI features require:
1. Privacy Impact Assessment
2. Risk assessment (Category A/B/C)
3. Governance review
4. Testing and validation
5. Staff training plan
6. Monitoring plan
7. Executive approval

### 12.2 Prohibited Features
The following AI applications are not permitted:
- Autonomous care decisions
- Unsupervised participant interactions
- Biometric identification without consent
- Predictive risk scoring without human review
- Automated incident classification

---

## 13. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 2025 | Platform Owner | Initial release |

**Approval**

| Role | Name | Date |
|------|------|------|
| Platform Owner | | |
| Privacy Officer | | |

---

*This policy must be reviewed annually or when new AI features are introduced.*
