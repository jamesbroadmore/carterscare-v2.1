# Carter's Care v2 - Visual Information Architecture Map

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CARTER'S CARE v2 PLATFORM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐        ┌──────────────────┐                  │
│  │   LOGIN PAGE    │───────→│  AUTHENTICATION  │                  │
│  └─────────────────┘        └──────────────────┘                  │
│          │                           │                              │
│          └───────────────┬───────────┘                              │
│                          │                                          │
│                          ↓                                          │
│              ┌──────────────────────┐                              │
│              │ ROLE CHECK & ROUTE   │                              │
│              │  Admin vs Staff      │                              │
│              └──────────────────────┘                              │
│                   │            │                                   │
│        ┌──────────┘            └──────────┐                        │
│        │                                  │                        │
│        ↓                                  ↓                        │
│  ┌──────────────────┐          ┌──────────────────┐              │
│  │  ADMIN DASHBOARD │          │ STAFF DASHBOARD  │              │
│  │ (Full Metrics)   │          │ (My Shift View)  │              │
│  └──────────────────┘          └──────────────────┘              │
│        │                                  │                        │
│        └──────────────┬───────────────────┘                        │
│                       │                                            │
│                       ↓                                            │
│          ┌────────────────────────┐                               │
│          │   SIDEBAR NAVIGATION   │                               │
│          │  (13 Main Sections)    │                               │
│          └────────────────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Sidebar Navigation Structure (Detailed)

```
CARTER'S CARE PLATFORM
│
├─ OVERVIEW
│  └─ Dashboard ⭐
│
├─ PEOPLE
│  ├─ Staff (Admin)
│  │  └─ Staff Profile
│  │     ├─ Overview
│  │     ├─ Roster
│  │     ├─ Timesheets
│  │     ├─ My Certs
│  │     ├─ Training (NDIS Modules, Accredited)
│  │     ├─ HR/Onboarding
│  │     └─ Compliance
│  │
│  └─ Clients (All Users)
│     └─ Client Profile
│        ├─ Overview
│        ├─ Schedule
│        ├─ Care Plan
│        ├─ Case Notes
│        ├─ Risk Management (Assessments, Safety Plans)
│        ├─ Documents (Service Agreements, etc.)
│        └─ Incidents
│
├─ SHIFTS
│  ├─ Roster (Calendar, Staff, Client Views)
│  │  └─ Shift Detail
│  │     ├─ Assigned Staff
│  │     ├─ Date & Time
│  │     └─ Link to Check-In
│  │
│  ├─ Check-In (Dashboard button)
│  │  └─ Auto-detects shift, tracks Checked-In/Out
│  │     └─ Feeds to Timesheets
│  │
│  ├─ Timesheets (My vs All based on role)
│  │  └─ Timesheet Detail
│  │     ├─ Auto-generated from Case Notes
│  │     ├─ Check-In validation
│  │     └─ Submission Status (draft, submitted, approved, paid)
│  │
│  └─ Invoices (My vs All based on role)
│     └─ Invoice Detail
│        ├─ Status (Draft, Generated, Sent, Paid)
│        ├─ Linked to Timesheet
│        ├─ Linked to Client
│        └─ Linked to Worker
│
├─ RECORDS
│  ├─ Case Notes (My vs All)
│  │  └─ Note Detail
│  │     ├─ Linked to Shift
│  │     ├─ Linked to Timesheet
│  │     └─ Linked to Invoice
│  │
│  └─ Incidents (My vs All)
│     └─ Incident Detail
│        ├─ Type (Client, Workplace)
│        ├─ Description
│        ├─ Attachments
│        └─ Follow-Up
│
├─ COMPLIANCE
│  ├─ My Certs (Staff view)
│  │  ├─ Certifications
│  │  ├─ Expiry Tracking
│  │  └─ Training Status
│  │
│  └─ Compliance (Admin)
│     └─ Organization-wide
│        ├─ Staff Compliance Dashboard
│        ├─ Expiry Alerts
│        ├─ Training Records
│        └─ Audit Trail
│
├─ FINANCE
│  ├─ Financials (Admin)
│  │  └─ Financial Reports
│  │
│  └─ Reports (Admin)
│     ├─ Financial Reports (revenue, invoices)
│     ├─ Staff Reports (hours, utilization)
│     ├─ Client Reports (service hours, cost)
│     └─ Compliance Reports (certifications)
│
├─ OTHER
│  ├─ Onboarding
│  │  ├─ Step 1: Welcome (Mission, Values, Contacts)
│  │  ├─ Step 2: Policies (Read & Acknowledge)
│  │  ├─ Step 3: System Guide (Platform Tutorial)
│  │  └─ Step 4: Checklist (Tasks)
│  │
│  └─ Settings (Admin)
│     ├─ Portal Settings
│     ├─ Roles & Permissions
│     ├─ Modules
│     └─ UX Tweaks
│
└─ USER PROFILE (Sidebar Footer)
   ├─ Avatar with Initials
   ├─ Display Name
   ├─ Email
   └─ Sign Out
```

---

## Data Flow Diagrams

### 1. Shift → Timesheet → Invoice Flow

```
┌──────────────┐
│ Shift Created│
└──────────────┘
       │
       ↓
┌──────────────────────┐
│ Staff Works on Shift │
│ (Roster View)        │
└──────────────────────┘
       │
       ↓
┌──────────────────────┐
│ Check-In / Check-Out │
│ (Logs actual hours)  │
└──────────────────────┘
       │
       ↓
┌──────────────────────┐
│ Case Notes Created   │
│ (Documents work)     │
└──────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ AUTOMATED CONVERSION         │
│ (Database Trigger)           │
│ Notes + Check-In → Timesheet │
└──────────────────────────────┘
       │
       ↓
┌──────────────────────┐
│ Timesheet Created    │
│ (Draft Status)       │
└──────────────────────┘
       │
       ↓
┌──────────────────────┐
│ Admin Reviews        │
│ & Approves Timesheet │
└──────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ AUTOMATED CONVERSION         │
│ (Database Trigger)           │
│ Approved Timesheet → Invoice │
└──────────────────────────────┘
       │
       ↓
┌──────────────────────┐
│ Invoice Generated    │
│ (Draft Status)       │
└──────────────────────┘
       │
       ↓
┌──────────────────────┐
│ Invoice Sent to      │
│ Client (Billing)     │
└──────────────────────┘
       │
       ↓
┌──────────────────────┐
│ Invoice Marked as    │
│ Paid (Completed)     │
└──────────────────────┘
```

---

### 2. Staff Onboarding Flow

```
┌─────────────────────┐
│ New Staff Created   │
│ (HR System)         │
└─────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│ Onboarding Tasks Assigned   │
│ (Welcome, Policies, etc.)   │
└─────────────────────────────┘
       │
       ↓
┌─────────────────────┐
│ Staff Logs In       │
│ (First Time)        │
└─────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Onboarding Page Auto-Shows   │
│ (Not Completed Yet)          │
└──────────────────────────────┘
       │
       ├─→ Step 1: Welcome
       │   (Company Mission, Values, Contacts)
       │   └─→ Next
       │
       ├─→ Step 2: Policies
       │   (Read & Acknowledge Required Policies)
       │   └─→ Next
       │
       ├─→ Step 3: System Guide
       │   (Platform Tutorial)
       │   └─→ Next
       │
       └─→ Step 4: Checklist
           (Complete Assigned Tasks)
           └─→ Complete
                │
                ↓
        ┌────────────────────┐
        │ Onboarding Done    │
        │ → Dashboard Access │
        └────────────────────┘
```

---

### 3. Incident Reporting & Follow-Up

```
┌──────────────────┐
│ Incident Occurs  │
│ (Client or Work) │
└──────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Staff Reports Incident   │
│ (Navigate to Incidents)  │
└──────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Select Incident Type     │
│ • Client Incident        │
│ • Workplace Incident     │
└──────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Fill Incident Form       │
│ • Description            │
│ • Upload Attachments     │
│ • Assign Follow-Up       │
└──────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Submit Incident Report   │
│ (Status: Open)           │
└──────────────────────────┘
       │
       ├─→ Alert Notification
       │   (Dashboard shows open incidents)
       │
       ↓
┌──────────────────────────┐
│ Manager Reviews Incident │
│ (Incidents Page)         │
└──────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Investigation Underway   │
│ (Status: Investigating)  │
└──────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Follow-Up Actions Done   │
│ (Documentation Updated)  │
└──────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Mark as Resolved         │
│ (Status: Closed)         │
└──────────────────────────┘
```

---

### 4. Compliance Tracking (Certifications & Expiry)

```
STAFF PERSPECTIVE
┌──────────────────────┐
│ Staff Certification  │
│ Added to Record      │
└──────────────────────┘
       │
       ├─→ Can View in: My Certs (Sidebar)
       │
       ↓
┌──────────────────────────┐
│ Dashboard Shows:         │
│ • Certification Valid    │
│ • Expiry Date (if known) │
└──────────────────────────┘
       │
       ↓ (As expiry approaches)
┌──────────────────────────┐
│ System Alert:            │
│ "Expires in 30 days"     │
└──────────────────────────┘
       │
       ├─→ Notification shows in Dashboard
       ├─→ Compliance alert appears
       │
       ↓
┌──────────────────────────┐
│ Renew Certification      │
│ (Upload new cert)        │
└──────────────────────────┘

ADMIN PERSPECTIVE
       │
       └──→ Compliance Dashboard
           ├─→ View all staff certifications
           ├─→ See expiry dates
           ├─→ Identify expiring certifications
           ├─→ Generate compliance reports
           └─→ Track training completion
```

---

## User Journey: New Staff Member

```
Day 1: Onboarding
  ├─ HR Creates Staff Account
  ├─ System Sends Login Credentials
  ├─ Staff Logs In → Onboarding Page Appears
  ├─ Completes 4-Step Onboarding
  │  ├─ Welcome (reads company mission & values)
  │  ├─ Policies (reads & acknowledges all required policies)
  │  ├─ System Guide (learns how to use platform)
  │  └─ Checklist (completes assigned tasks)
  ├─ Onboarding Marked Complete
  └─ Dashboard Becomes Primary Interface

Week 1: First Shift
  ├─ Manager Assigns First Shift (via Roster)
  ├─ Staff Sees Shift in: Roster, Dashboard
  ├─ Staff Clicks "Check-In" on Dashboard
  ├─ Shift Auto-Detected & Checked In
  ├─ Staff Works & Documents Actions in Case Notes
  ├─ Staff Clicks "Check-Out" (Ends Timesheet Auto-Generation)
  └─ Timesheet Created & Awaits Manager Approval

Week 2: Management
  ├─ Manager Approves Timesheet
  ├─ Invoice Auto-Generated
  ├─ Staff Can View Invoice (pending payment)
  ├─ Staff Checks "My Certs" Section
  └─ Can See All Required Certifications & Expiry Dates

Ongoing:
  ├─ Staff Views Roster → Check-In → Work → Check-Out
  ├─ Repeats for each shift
  ├─ Can File Incidents if needed
  ├─ Can View Case Notes, Timesheets, My Certs
  ├─ Receives Compliance Alerts (cert expiring soon)
  └─ Can Access Support via Onboarding > System Guide
```

---

## User Journey: Manager/Admin

```
Daily
  ├─ Login to Dashboard
  ├─ View Key Metrics:
  │  ├─ Total Staff (Active)
  │  ├─ Total Clients (Active)
  │  ├─ Today's Shifts
  │  ├─ Pending Incidents
  │  └─ Compliance Alerts
  ├─ Review Notifications
  │  ├─ Open Incidents (needs action)
  │  ├─ Compliance Issues (expiring certs)
  │  └─ Pending Check-Ins (staff on duty)
  └─ Navigate to relevant sections

Weekly
  ├─ Review Staff Timesheets
  │  └─ Approve → Auto-generates Invoices
  ├─ Review Incidents
  │  ├─ Investigate if needed
  │  ├─ Assign follow-ups
  │  └─ Mark resolved
  ├─ Check Compliance Status
  │  └─ Identify staff needing cert renewal
  └─ Review Case Notes
     └─ Ensure adequate documentation

Monthly
  ├─ Generate & Review Reports
  │  ├─ Financial Report (invoices, revenue)
  │  ├─ Staff Report (hours, utilization)
  │  ├─ Client Report (service hours)
  │  └─ Compliance Report (cert status)
  ├─ Adjust Rosters for Next Month
  ├─ Review Staff Performance
  └─ Update Portal Settings if Needed

As Needed
  ├─ Manage Staff & Clients
  │  ├─ Create new profiles
  │  ├─ Edit details
  │  └─ Manage roles & permissions
  └─ Manage Settings
     ├─ Portal configurations
     ├─ Role permissions
     └─ Module enablement
```

---

## Cross-Section Links & Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA RELATIONSHIP MAP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Clients          Staff            Shifts                      │
│      ↙             ↙                   ↙                         │
│       └─────────→ Roster ←─────────────┘                        │
│                      ↓                                           │
│                  Check-In                                       │
│                      ↓                                           │
│   Case Notes ←──── Shift                                        │
│      ↓                ↓                                          │
│      └──→ Timesheet ←─┘                                         │
│              ↓                                                   │
│           Invoice                                               │
│              ↓                                                   │
│         Financials                                              │
│                                                                 │
│   Staff ←──→ Compliance ←──→ My Certs                           │
│              ↓                  ↓                                │
│         Incidents ←───────── Follow-Up                          │
│                                                                 │
│   Clients ←──→ Risk Management                                  │
│         ↓           ↓                                            │
│    Care Plan    Assessments                                     │
│                                                                 │
│   All Data ←──→ Reports                                         │
│   (Financial,     (Generated                                    │
│    Staff,         Monthly)                                      │
│    Client,                                                      │
│    Compliance)                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Information Flow: Permission Model

```
┌────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED VISIBILITY                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ADMIN
│  ├─ Can see ALL data (all clients, all staff, all shifts)     │
│  ├─ Can modify all records                                    │
│  ├─ Can approve timesheets & generate invoices               │
│  ├─ Can manage users & permissions                            │
│  ├─ Can access Settings & Reports                             │
│  └─ Sees "All" views of timesheets, invoices, case notes     │
│                                                                │
│  MANAGER (if applicable)
│  ├─ Can see assigned staff & their clients                    │
│  ├─ Can see assigned client details                           │
│  ├─ Can view team's timesheets & roster                       │
│  ├─ Can approve team's timesheets                             │
│  ├─ Can review team's incidents                               │
│  └─ Cannot access: Settings, System Reports                   │
│                                                                │
│  STAFF
│  ├─ Can only see their own data                               │
│  ├─ Can see assigned clients (for shifts)                     │
│  ├─ Can see own roster, timesheets, invoices                  │
│  ├─ Can create case notes for assigned shifts                 │
│  ├─ Can report incidents                                      │
│  ├─ Can see own certifications & compliance                   │
│  └─ Cannot access: Other staff data, Settings, Reports        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Mobile Responsiveness & Navigation

```
DESKTOP (Wide Screen)
├─ Sidebar Always Visible (220px width)
├─ Collapsible to Icon-Only View
├─ Main Content Takes Remaining Space
└─ Header Shows Title + Actions

TABLET (Medium Screen)
├─ Sidebar Collapsible (hamburger menu)
├─ When Collapsed: Shows Icons Only
├─ Content Expands Full Width
└─ Header Shows Hamburger + Title

MOBILE (Small Screen)
├─ Sidebar Hidden by Default
├─ Hamburger Menu in Header Opens Sidebar
├─ Full Width Content
├─ Bottom: Quick Action Buttons (Check-In, etc.)
└─ Touch-Optimized Navigation
```

---

## Accessibility Hierarchy

```
Level 1: Critical (Always Accessible)
├─ Dashboard (entry point)
├─ Check-In (shift tracking)
├─ Clients (care delivery)
└─ Roster (shift visibility)

Level 2: Important (Regularly Used)
├─ Timesheets (payroll)
├─ Case Notes (documentation)
├─ Incidents (safety)
└─ My Certs (compliance)

Level 3: Management (Admin/Manager)
├─ Staff (team management)
├─ Invoices (billing)
├─ Compliance (org-level)
└─ Reports (analytics)

Level 4: Configuration (Admin Only)
├─ Settings (system config)
├─ Financials (financial data)
└─ Onboarding (staff setup)
```

---

This visual map can be referenced during:
- Onboarding new developers
- Planning feature changes
- Testing user journeys
- Documenting workflows
- Training staff on the platform

