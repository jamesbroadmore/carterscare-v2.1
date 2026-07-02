# Client-Based Care Visit Scheduling Feature

## Overview
The Carters Care platform now includes a centralized care visit scheduling feature accessible directly from a client's profile card, eliminating the need for duplicate scheduling functionality across different parts of the app.

## Features Implemented

### 1. **ScheduleServiceDialog Component** (`components/ScheduleServiceDialog.tsx`)
A comprehensive dialog for pre-scheduling care visits for specific clients.

**Capabilities:**
- Pre-fills the client name and ID automatically
- Supports scheduling multiple care visits in one session
- Allows selecting start and end times (default: 9am-11am)
- Supports custom notes for each visit
- Duplicate and remove visit entries before submission
- Automatically creates roster entries in the timesheets table

**Key Props:**
```typescript
interface ScheduleServiceDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  defaultDate?: string;        // ISO date string
  defaultHour?: number;        // Hour (0-23)
}
```

### 2. **Integration with ClientWorkspaceCard**
The dialog is seamlessly integrated into the client detail view with two entry points:

#### "Add Service" Button
- Located in the Schedule tab header
- Opens the dialog with today's date and 9am default time
- Reduces admin friction when scheduling from client overview

#### "+ Add" Buttons in Day Cells
- Located in each day column in the weekly schedule grid
- Pre-fills the dialog with that specific date
- Allows quick scheduling directly from the visual week view
- Contextual timing awareness

### 3. **Automatic Roster Generation**
When a care visit is scheduled, the system:
1. Creates timesheet entries with the following details:
   - Staff member assignment
   - Client ID
   - Date and time (start/end)
   - Optional notes
   - Status: "pending" (awaiting confirmation)

2. Automatically refreshes roster queries:
   - `roster-timesheets`
   - `timesheets`
   - `client-shifts` (for the specific client)

### 4. **Staff Assignment**
- Fetches active staff list from database
- Displays staff by preferred name or full name
- Required validation: Every visit must have a staff member assigned

## Data Flow

```
User clicks "Add Service" or "+ Add" in Schedule Tab
        ↓
setShowScheduleDialog(true) + date/time pre-fill
        ↓
ScheduleServiceDialog opens with client pre-selected
        ↓
User selects staff, times, and optional notes
        ↓
Form submission calls Supabase insert to timesheets
        ↓
Automatic query invalidation updates:
   - Roster views
   - Client shift history
   - Timesheet lists
        ↓
Dialog closes, toast notification confirms success
```

## UI/UX Design Decisions

1. **Centralized Location**: All scheduling happens from the client's own card, reducing navigation and context switching
2. **Batch Scheduling**: Users can schedule multiple visits in one interaction (useful for recurring care patterns)
3. **Smart Defaults**: Dates and times are pre-filled based on context (today, next Monday, specific day cell clicked)
4. **Visual Feedback**: 
   - Loading state on submit button
   - Toast notifications for success/error
   - Refresh of schedule display immediately after success

## Technical Implementation

### Database Integration
- Uses Supabase `timesheets` table
- Respects Perth AWST timezone (UTC+8) for all time calculations
- Maintains data consistency via React Query cache invalidation

### State Management
- ClientWorkspaceCard manages dialog open/close state
- Dialog state includes pre-selected date and default hour
- Passed via props to maintain unidirectional data flow

### Validation
- Client ID is automatically set (no user error possible)
- Support worker selection is required
- Date and time fields are required
- Notes are optional

## Code Structure

### New Files
- `/frontend/src/components/ScheduleServiceDialog.tsx` - Dialog component (271 lines)

### Modified Files
- `/frontend/src/components/ClientWorkspaceCard.tsx`:
  - Added ScheduleServiceDialog import
  - Added state for dialog management
  - Wired "Add Service" button
  - Wired "+ Add" buttons in day cells
  - Passed dialog handlers to ScheduleTab

## Benefits

1. **Reduced Duplication**: No separate scheduling pages needed; everything is accessible from the client card
2. **Admin Efficiency**: Pre-scheduling care visits automatically generates roster entries without manual data entry
3. **Single Source of Truth**: All scheduling happens through one dialog interface
4. **Contextual Awareness**: Default dates/times adapt to where the user clicked in the schedule
5. **Batch Operations**: Schedule multiple visits in one session

## Testing

The feature has been:
- ✓ Built without errors (7.75s build time)
- ✓ Type-checked (TypeScript compilation)
- ✓ Integrated with existing React Query caching
- ✓ Wired to actual database (Supabase timesheets table)
- ✓ Tested with browser rendering (dialog opens correctly)

## Future Enhancements

Potential improvements for future releases:
- Recurring visit templates (e.g., "Every Monday 9am-11am")
- Bulk scheduling from staff roster view
- Client availability preferences
- Support worker availability conflicts detection
- Email/SMS notifications to assigned workers
- Scheduling templates by service type

## Deployment Notes

No additional configuration needed. The feature:
- Uses existing Supabase connection
- Follows current app patterns for queries and mutations
- No new environment variables required
- Compatible with all existing auth roles (admin can schedule)
