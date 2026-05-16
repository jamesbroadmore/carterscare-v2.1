# Information Architecture Implementation Guide

## Overview
This guide outlines how to fully implement the Carter's Care v2 IA model and address remaining gaps.

---

## 1. Fixed Issues ✅

### 1.1 Sidebar Scroll Reset (FIXED)
**Issue:** Sidebar scroll position was not resetting when navigating between sections
**Solution Implemented:**
- Added `useRef` to track sidebar content element
- Added `useEffect` hook to reset scroll position on pathname change
- Applied ref to `<SidebarContent>` component

**Files Modified:**
- `frontend/src/components/AppSidebar.tsx`

**Code Change:**
```tsx
const sidebarContentRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (sidebarContentRef.current) {
    sidebarContentRef.current.scrollTop = 0;
  }
}, [location.pathname]);
```

---

### 1.2 Avatar Support in Onboarding (ENHANCED)
**Issue:** Onboarding used generic welcome without user context
**Solution Implemented:**
- Added user avatar with initials to Welcome step
- Display personalized greeting with user name
- Created warmer, more human onboarding feel

**Files Modified:**
- `frontend/src/pages/Onboarding.tsx`

**Features Added:**
- Gradient avatar with user initials
- Personalized welcome message: "Welcome, [Name]!"
- Visual distinction for each user
- Consistent with app-wide avatar style

---

## 2. Remaining Verification Tasks

### 2.1 Dashboard Role-Aware View
**Current Status:** ✅ VERIFIED

**Verified Features:**
- Admin view shows: Staff count, Client count, Today's shifts, Incidents, Compliance alerts
- Greeting pulls user's preferred name from database
- StatCards display key metrics with navigation
- Notification system tracks: incidents, compliance, check-ins

**Code Location:** `frontend/src/pages/Dashboard.tsx`

**No changes needed** - fully implements IA requirements

---

### 2.2 Client Profile Hierarchy
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Structure (from IA):**
```
Clients
└── Client Profile
    ├── Overview ("About Me")
    ├── Schedule
    ├── Care Plan
    ├── Case Notes
    ├── Risk Management
    │   ├── Assessments
    │   └── Safety Plans
    ├── Documents
    │   ├── Service Agreements
    │   └── Other Docs
    └── Incidents (Client-related)
```

**Current Implementation:** `frontend/src/pages/Clients.tsx`

**Verification Steps:**
1. Check if individual client profile page exists
2. Verify all subsections are accessible
3. Confirm Risk Management is separate from main profile
4. Verify document management is implemented

**Action Items:**
- [ ] Examine Clients.tsx to understand current structure
- [ ] Check if profile detail view exists and is routable
- [ ] Verify risk assessment subsection exists
- [ ] Create missing subsections if needed

---

### 2.3 Staff Profile Hierarchy
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Structure (from IA):**
```
Staff
└── Staff Profile
    ├── Overview
    ├── Roster
    ├── Timesheets
    ├── My Certs
    ├── Training
    │   ├── NDIS Worker Modules
    │   └── Accredited Training
    ├── HR / Onboarding
    └── Compliance
```

**Current Implementation:** `frontend/src/pages/Staff.tsx`

**Verification Steps:**
1. Check if individual staff profile page exists
2. Verify all subsections are accessible
3. Confirm Training subsections (NDIS Modules, Accredited) exist
4. Verify HR/Onboarding integration

**Action Items:**
- [ ] Examine Staff.tsx to understand current structure
- [ ] Check if profile detail view exists and is routable
- [ ] Verify training module subsections
- [ ] Create missing training sections if needed

---

### 2.4 Roster Multiple Views
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Features (from IA):**
- Calendar View
- Staff View
- Client View
- Shift Details with assigned staff, date/time, and check-in link

**Current Implementation:** `frontend/src/pages/Roster.tsx`

**Verification Steps:**
1. Check if calendar view is implemented
2. Verify staff view (all staff shifts)
3. Verify client view (all client shifts)
4. Check shift detail page shows required info

**Action Items:**
- [ ] Examine Roster.tsx for view toggle
- [ ] Verify calendar component is used
- [ ] Check shift detail page structure
- [ ] Create missing views if needed

---

### 2.5 Timesheets Automation
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Features (from IA):**
- My Timesheets (Staff view)
- All Timesheets (Admin view)
- Auto-generated from Case Notes
- Check-In validation
- Submission status tracking

**Current Implementation:** `frontend/src/pages/Timesheets.tsx`

**Verification Steps:**
1. Check if timesheet is auto-generated from notes
2. Verify check-in validation is implemented
3. Confirm submission status tracking exists
4. Verify role-aware views (my vs. all)

**Action Items:**
- [ ] Examine Timesheets.tsx for auto-generation logic
- [ ] Check database triggers for note→timesheet conversion
- [ ] Verify check-in validation logic
- [ ] Test status tracking workflow

---

### 2.6 Invoice Automation
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Features (from IA):**
- Draft, Generated, Sent, Paid status tracking
- Auto-generated from approved timesheets
- Linked to client + worker

**Current Implementation:** `frontend/src/pages/Invoices.tsx`

**Verification Steps:**
1. Check if invoices are auto-generated from timesheets
2. Verify status filtering works (Draft, Generated, Sent, Paid)
3. Confirm client and worker links exist
4. Check invoice generation trigger

**Action Items:**
- [ ] Examine Invoices.tsx for status display
- [ ] Check database triggers for timesheet→invoice conversion
- [ ] Verify automation is functional
- [ ] Test status filtering

---

### 2.7 Case Notes Linking
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Features (from IA):**
- Organize by Client
- Organize by Staff
- Link to Shift, Timesheet, Invoice

**Current Implementation:** `frontend/src/pages/CaseNotes.tsx`

**Verification Steps:**
1. Check if notes can be filtered by client
2. Check if notes can be filtered by staff
3. Verify links to associated shift exist
4. Verify timesheet reference exists
5. Verify invoice reference exists

**Action Items:**
- [ ] Examine CaseNotes.tsx for filtering logic
- [ ] Check if shift link is functional
- [ ] Verify timesheet cross-reference
- [ ] Test invoice linking

---

### 2.8 Incidents Type Support
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Features (from IA):**
- Client Incidents
- Workplace Incidents
- Incident Detail with Description, Attachments, Follow-Up

**Current Implementation:** `frontend/src/pages/Incidents.tsx`

**Verification Steps:**
1. Check if incident type selection exists
2. Verify description field is implemented
3. Check if attachments are supported
4. Verify follow-up tracking exists

**Action Items:**
- [ ] Examine Incidents.tsx for type selector
- [ ] Check form for all required fields
- [ ] Verify attachment upload functionality
- [ ] Test follow-up workflow

---

### 2.9 Compliance Expiry Tracking
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Features (from IA):**
- Staff Compliance (My Certs): Certifications, Expiry Tracking, Training Status
- Organizational Compliance: Organization-level tracking

**Current Implementation:** 
- `frontend/src/pages/Compliance.tsx` (Org-level)
- `frontend/src/pages/MyCompliance.tsx` (Staff-level)

**Verification Steps:**
1. Check MyCompliance.tsx for expiry date display
2. Verify certification status tracking
3. Check if expiry alerts are implemented
4. Verify notification system includes compliance alerts

**Action Items:**
- [ ] Examine MyCompliance.tsx for expiry tracking
- [ ] Check data model for expiry date field
- [ ] Verify notification system includes compliance
- [ ] Test expiry alert functionality

---

### 2.10 Report Types
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Features (from IA):**
- Financial Reports
- Staff Reports
- Client Reports
- Compliance Reports

**Current Implementation:** 
- `frontend/src/pages/Reports.tsx`
- `frontend/src/pages/Financials.tsx`

**Verification Steps:**
1. Check if financial reports are implemented
2. Check if staff reports exist
3. Check if client reports exist
4. Check if compliance reports exist

**Action Items:**
- [ ] Examine Reports.tsx for report types
- [ ] Check if all report types are selectable
- [ ] Verify report generation/export
- [ ] Create missing report types if needed

---

### 2.11 Settings Subsections
**Current Status:** ⚠️ NEEDS VERIFICATION

**Expected Subsections (from IA):**
- Portal Settings
- Roles & Permissions
- Modules
- UX Tweaks

**Current Implementation:** `frontend/src/pages/SettingsPage.tsx`

**Verification Steps:**
1. Check if subsection tabs/menu exists
2. Verify each subsection is implemented
3. Check if portal settings are functional
4. Verify role/permission management

**Action Items:**
- [ ] Examine SettingsPage.tsx structure
- [ ] Create missing subsection interface if needed
- [ ] Implement any missing subsections
- [ ] Add UX Tweaks section if missing

---

## 3. Implementation Checklist

### Phase 1: Critical UX Fixes ✅ COMPLETE
- [x] Fix sidebar scroll reset
- [x] Enhance onboarding with avatar
- [x] Verify role-aware Dashboard

### Phase 2: Verification (Recommended)
- [ ] Dashboard role-aware view - **Status: VERIFIED ✅**
- [ ] Client profile hierarchy - **Status: PENDING**
- [ ] Staff profile hierarchy - **Status: PENDING**
- [ ] Roster multiple views - **Status: PENDING**
- [ ] Timesheets automation - **Status: PENDING**
- [ ] Invoice automation - **Status: PENDING**
- [ ] Case notes linking - **Status: PENDING**
- [ ] Incidents type support - **Status: PENDING**
- [ ] Compliance expiry tracking - **Status: PENDING**
- [ ] Report types - **Status: PENDING**
- [ ] Settings subsections - **Status: PENDING**

### Phase 3: Documentation
- [ ] Create data model documentation
- [ ] Document API endpoints for each section
- [ ] Create user guide for each feature
- [ ] Document role-based access control

---

## 4. Testing Strategy

### Manual Testing Checklist
For each section (Clients, Staff, Roster, etc.):
1. **Navigation Test**
   - [ ] Can navigate to section from sidebar
   - [ ] Sidebar highlights current section
   - [ ] Breadcrumbs (if present) show correct path

2. **Permission Test**
   - [ ] Admin sees all sections
   - [ ] Staff sees only accessible sections
   - [ ] Staff cannot access admin-only pages

3. **Data Test**
   - [ ] Data loads correctly
   - [ ] Filtering/sorting works
   - [ ] Create/edit/delete operations function

4. **Link Test**
   - [ ] Cross-section links work (e.g., Case Notes → Timesheet)
   - [ ] Drill-down navigation works (e.g., Clients → Client Detail)
   - [ ] Back navigation works

---

## 5. Navigation Summary

### Accessible From Sidebar (All Users See Based on Role)
```
Dashboard           → Admin/Manager view
Clients             → All (filtered by assigned clients)
Staff               → Admin only (with filtering for managers)
Roster              → All (shows assigned shifts)
Check-In            → All (shows assigned shifts)
Timesheets          → All (My vs All based on role)
Invoices            → All (My vs All based on role)
Case Notes          → All (My vs All based on role)
Incidents           → All (can report, view assigned)
My Certs            → All (staff compliance)
Compliance          → Admin only (org compliance)
Financials          → Admin only
Reports             → Admin only
Onboarding          → Staff (first login)
Settings            → Admin only
```

### Cross-Links (Should Work)
- Client → Client Profile → Case Notes
- Client → Client Profile → Incidents
- Staff → Staff Profile → Timesheets
- Staff → Staff Profile → Roster
- Shift → Shift Detail → Check-In → Timesheet
- Timesheet → Case Notes
- Timesheet → Invoice
- Case Note → Associated Shift
- Incident → Associated Client/Staff

---

## 6. Notes for Implementation

### Data Model Considerations
- Ensure `profiles` table has `display_name` field (currently used in avatar)
- Ensure `staff` table has `preferred_name` and `first_name` fields
- Ensure all linking tables have proper foreign keys

### Performance Considerations
- Implement pagination for large lists (Staff, Clients, Case Notes)
- Cache frequently accessed data (staff count, client count, etc.)
- Consider denormalization for dashboard metrics

### Accessibility Considerations
- Ensure all interactive elements are keyboard accessible
- Provide aria-labels for icon-only buttons
- Ensure sufficient color contrast in all views
- Test with screen readers

---

## 7. References
- **Design System:** Shadcn/ui components with Tailwind CSS
- **Authentication:** Supabase Auth with role-based access
- **Data Fetching:** React Query (TanStack Query)
- **Styling:** Tailwind CSS with custom theme colors
- **Icons:** Lucide React

---

## 8. Questions for Product Owner

Before full implementation, clarify:
1. Should managers see staff reports (currently admin-only)?
2. Should staff be able to edit own case notes, or view-only?
3. Are there additional user roles (Supervisor, Manager, Coordinator) beyond Admin/Staff?
4. Should incidents have escalation workflows?
5. Should compliance tracking have automated reminders?
6. Should invoices have approval workflow before payment?
