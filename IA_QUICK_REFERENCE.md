# Carter's Care v2 - Information Architecture Quick Reference

## Global Navigation (Always Visible in Sidebar)

```
┌─────────────────────────────────────────────┐
│  CARTER'S CARE PLATFORM                     │
├─────────────────────────────────────────────┤
│  OVERVIEW                                   │
│  • Dashboard ⭐                              │
├─────────────────────────────────────────────┤
│  PEOPLE                                     │
│  • Staff (admin only)                       │
│  • Clients                                  │
├─────────────────────────────────────────────┤
│  SHIFTS                                     │
│  • Roster                                   │
│  • Check-In                                 │
│  • Timesheets                               │
│  • Invoices                                 │
├─────────────────────────────────────────────┤
│  RECORDS                                    │
│  • Case Notes                               │
│  • Incidents                                │
├─────────────────────────────────────────────┤
│  COMPLIANCE                                 │
│  • My Certs (staff view)                    │
│  • Compliance (admin only)                  │
├─────────────────────────────────────────────┤
│  FINANCE                                    │
│  • Financials (admin only)                  │
│  • Reports (admin only)                     │
├─────────────────────────────────────────────┤
│  OTHER                                      │
│  • Onboarding                               │
│  • Settings (admin only)                    │
├─────────────────────────────────────────────┤
│  [User Avatar] Name | Sign Out              │
└─────────────────────────────────────────────┘
```

---

## Key Pages & Features

### 🏠 Dashboard
**Role-Aware Landing Page**
- **Admin/Manager View:** Today's shifts, staff check-ins, alerts (incidents, compliance, outstanding invoices)
- **Staff View:** Today's shift, Quick Check-In button, My roster, tasks & reminders, notifications
- **Notifications:** Open incidents, compliance alerts, active check-ins

---

### 👥 Clients
**Client Management & Care Planning**
```
Clients List
├── Client Profile
│   ├── Overview ("About Me")
│   ├── Schedule
│   ├── Care Plan
│   ├── Case Notes
│   ├── Risk Management
│   │   ├── Assessments
│   │   └── Safety Plans
│   ├── Documents
│   │   ├── Service Agreements
│   │   └── Other Docs
│   └── Incidents (Client-related)
```

**Access:** All users see only assigned clients

---

### 👤 Staff
**Team & Workforce Management**
```
Staff List (Admin Only)
├── Staff Profile
│   ├── Overview
│   ├── Roster
│   ├── Timesheets
│   ├── My Certs
│   ├── Training
│   │   ├── NDIS Worker Modules
│   │   └── Accredited Training
│   ├── HR / Onboarding
│   └── Compliance
```

**Access:** Admin only for list; staff can view own profile

---

### 📅 Roster
**Shift Scheduling & Visibility**
- Calendar View (all shifts at a glance)
- Staff View (shifts grouped by worker)
- Client View (shifts grouped by client)
- Shift Details (assigned staff, date/time, linked check-in)

**Access:** All users see assigned shifts

---

### ✅ Check-In System
**Embedded Shift Tracking**
- Available as button on Dashboard
- Auto-detects current shift (by date & time)
- Logs: Checked In, Checked Out
- Feeds into Timesheets automatically

**Access:** Staff for their shifts; Admin can view all

---

### ⏱️ Timesheets
**Work Hours & Payroll**
```
Timesheets
├── My Timesheets (staff view)
├── All Timesheets (admin view)
└── Timesheet Detail
    ├── Auto-generated from Case Notes
    ├── Check-In validation
    └── Submission Status (draft, submitted, approved, paid)
```

**Automation:** Generated from notes + check-ins

---

### 💰 Invoices
**Billing & Financial Tracking**
```
Invoices
├── Draft (not yet generated)
├── Generated (auto-created from approved timesheets)
├── Sent (to client)
└── Paid (completed)
```

**Automation:** Auto-generated from approved timesheets, linked to client + worker

---

### 📝 Case Notes
**Care & Service Documentation**
- Organize by Client (all notes for a client)
- Organize by Staff (all notes by a worker)
- **Linked to:** Shift, Timesheet, Invoice

**Access:** Staff create/view own + supervisor can view all assigned

---

### ⚠️ Incidents
**Safety & Compliance Tracking**
```
Incidents
├── Client Incident (safety event involving client)
├── Workplace Incident (health & safety event)
└── Incident Detail
    ├── Description
    ├── Attachments
    └── Follow-Up (resolution tracking)
```

**Access:** Staff report own; Admin/Manager review all assigned

---

### 🛡️ Compliance
**Certifications & Regulatory**

**For Staff (My Certs):**
- Certifications held
- Expiry tracking (alerts when expiring soon)
- Training status (completed, in-progress)

**For Organization (Compliance):**
- Staff compliance dashboard
- Expiry alerts
- Training records
- Audit trail

---

### 📊 Reports
**Analytics & Business Intelligence**
- Financial Reports (invoices, revenue by client)
- Staff Reports (hours, utilization, compliance)
- Client Reports (service hours, cost)
- Compliance Reports (staff certifications, training)

**Access:** Admin only

---

### ⚙️ Settings
**System & Portal Configuration**
```
Settings
├── Portal Settings (branding, defaults)
├── Roles & Permissions (user role management)
├── Modules (feature toggles)
└── UX Tweaks (sidebar width, theme, etc.)
```

**Access:** Admin only

---

### 🎓 Onboarding
**New Staff Welcome & Training**
- Step 1: Welcome (mission, values, contact info)
- Step 2: Policies (read & acknowledge required policies)
- Step 3: System Guide (platform tutorial)
- Step 4: Checklist (onboarding tasks)

**Flow:** Auto-shows on first login if not completed

---

## User Role Access Matrix

| Feature | Admin | Manager | Staff |
|---------|-------|---------|-------|
| Dashboard | ✅ Admin view | ✅ Manager view | ✅ Staff view |
| Clients | ✅ All | ✅ Assigned | ✅ Assigned |
| Staff | ✅ All | ⚠️ Team only | ❌ Own profile only |
| Roster | ✅ All | ✅ Team | ✅ Own shifts |
| Check-In | ✅ All | ✅ Team | ✅ Own shifts |
| Timesheets | ✅ All | ✅ Team | ✅ Own only |
| Invoices | ✅ All | ✅ Team | ✅ Own only |
| Case Notes | ✅ All | ✅ Team | ✅ Own + assigned |
| Incidents | ✅ All | ✅ Team | ✅ Report & assigned |
| My Certs | ✅ All | ✅ Team | ✅ Own |
| Compliance | ✅ Org level | ❌ | ✅ My Certs |
| Financials | ✅ | ❌ | ❌ |
| Reports | ✅ | ⚠️ Limited | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Onboarding | 🔄 Assign | 🔄 Assign | ✅ Required |

---

## Key Data Flows

### Shift → Timesheet → Invoice
```
Shift Created
    ↓
Check-In → Check-Out (logs hours)
    ↓
Case Notes (documents work done)
    ↓
Timesheet Auto-Generated (from notes + check-in)
    ↓
Admin Reviews & Approves
    ↓
Invoice Auto-Generated (from approved timesheet)
    ↓
Invoice Sent to Client
    ↓
Invoice Marked Paid
```

### Staff Onboarding
```
New Staff Created
    ↓
Onboarding Task List Assigned
    ↓
Staff Logs In → Sees Onboarding
    ↓
Completes Steps (Welcome, Policies, System, Checklist)
    ↓
Dashboard Available
```

### Incident Reporting
```
Staff Reports Incident
    ↓
Type: Client or Workplace
    ↓
Add Description + Attachments
    ↓
Submit to Manager/Admin
    ↓
Follow-Up Actions Assigned
    ↓
Marked Resolved
```

---

## Current Implementation Status

✅ = Fully implemented and verified
⚠️ = Implemented but needs verification
❌ = Not yet implemented

| Section | Status | Notes |
|---------|--------|-------|
| Global Navigation | ✅ | All 13 sections in sidebar |
| Dashboard | ✅ | Role-aware, metrics, notifications |
| Clients | ⚠️ | List view done, profile detail needs verification |
| Staff | ⚠️ | List view done, profile detail needs verification |
| Roster | ⚠️ | Basic view done, needs calendar & multi-view |
| Check-In | ✅ | Fully functional, linked to timesheets |
| Timesheets | ⚠️ | Basic done, auto-generation needs verification |
| Invoices | ⚠️ | Basic done, auto-generation needs verification |
| Case Notes | ⚠️ | Basic done, filtering & linking needs verification |
| Incidents | ⚠️ | Basic done, type support needs verification |
| Compliance | ⚠️ | Sections exist, expiry tracking needs verification |
| Reports | ⚠️ | Basic done, specific report types need verification |
| Settings | ⚠️ | Page exists, subsections need verification |
| Onboarding | ✅ | With avatar support (recently enhanced) |
| Sidebar Scroll | ✅ | Fixed with scroll reset on navigation |

---

## Recent Improvements (This Sprint)

1. ✅ **Fixed Sidebar Scroll Reset** - Sidebar now resets to top when navigating between sections
2. ✅ **Enhanced Onboarding** - Added user avatar with personalized greeting
3. ✅ **Documented IA Alignment** - Created comprehensive analysis of current state vs. planned IA

---

## Next Steps

1. **Verification Phase** - Systematically verify remaining ⚠️ sections
2. **Documentation** - Document actual data model and field names
3. **Testing** - Manual testing of all cross-section links
4. **Enhancement** - Implement any missing subsections or features
5. **User Testing** - Get feedback from actual staff and managers

---

## Questions & Notes

**For Product Owner:**
- Confirm expected user roles (currently: Admin, Staff)
- Clarify manager/supervisor permissions
- Define escalation workflows for incidents
- Confirm automation trigger points (invoice generation, etc.)

**For Developers:**
- See `IA_IMPLEMENTATION_GUIDE.md` for detailed implementation notes
- See `IA_ALIGNMENT_ANALYSIS.md` for gap analysis
- Use this document as quick reference during development

---

Last Updated: April 2026
Document Version: 1.0
