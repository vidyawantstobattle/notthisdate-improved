# NotThisDate Component Architecture

## Visual Component Hierarchy

```
App (Routing)
│
├── LandingPage (/)
│   ├── Hero Section
│   │   ├── Title
│   │   ├── Subtitle
│   │   └── Auth Buttons
│   │       ├── Login (uses AuthContext)
│   │       └── Signup (uses AuthContext)
│   │
│   └── Dashboard (if authenticated)
│       ├── Dashboard Header
│       │   ├── Title
│       │   └── Create Button → Modal
│       │
│       ├── Calendars Grid
│       │   └── CalendarCard (for each calendar)
│       │       ├── Calendar Info
│       │       ├── View Button
│       │       ├── Share Button
│       │       └── Delete Button
│       │
│       └── Empty State (if no calendars)
│
└── CalendarPage (/c/:id)
    ├── Calendar Header
    │   ├── Title
    │   ├── Description
    │   └── Date Range
    │
    ├── Tabs
    │   ├── Submit Tab (default)
    │   │   ├── ParticipantInput
    │   │   │   ├── Dropdown (defined participants)
    │   │   │   ├── Text Input (open calendar)
    │   │   │   └── Email Verification (if required)
    │   │   │
    │   │   ├── DatePicker (Flatpickr wrapper)
    │   │   │   └── Calendar Grid
    │   │   │       ├── Selected Dates (highlighted)
    │   │   │       └── Submitted Dates (solid)
    │   │   │
    │   │   ├── DateRangeDisplay
    │   │   │   └── Date Tags (removable)
    │   │   │
    │   │   ├── Status Message
    │   │   │
    │   │   └── Action Buttons
    │   │       ├── Submit Button
    │   │       └── Reset Button
    │   │
    │   └── View Tab
    │       ├── AvailabilityView
    │       │   └── Month Calendars (multiple)
    │       │       └── Calendar Grid
    │       │           └── Date Cells
    │       │               └── Color-coded by availability
    │       │
    │       └── Date Details Modal
    │           ├── Date Info
    │           ├── Unavailable List
    │           └── Available List
    │
    └── User Submissions Section
        └── Submission Items (list)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│           Context Providers                  │
├─────────────────────────────────────────────┤
│  AuthContext: user, login, logout           │
│  LanguageContext: language, t()             │
└─────────────────────────────────────────────┘
                    ↓ provides
┌─────────────────────────────────────────────┐
│                  App                         │
│         (Routes & Navigation)                │
└─────────────────────────────────────────────┘
         ↓                           ↓
┌──────────────────┐      ┌─────────────────────┐
│  LandingPage     │      │   CalendarPage      │
└──────────────────┘      └─────────────────────┘
         ↓                           ↓
    Uses Auth                 ┌─────────────┐
    Context                   │ useCalendar │ Custom Hook
                              └─────────────┘
                                     ↓
                          Fetches from Netlify Functions
                                     ↓
                          ┌──────────────────────┐
                          │  /.netlify/functions │
                          ├──────────────────────┤
                          │  - get-calendar      │
                          │  - submit-unavail.   │
                          │  - get-unavail.      │
                          │  - reset-unavail.    │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │   Netlify Blobs      │
                          │   (Key-Value Store)  │
                          └──────────────────────┘
```

## Component Props Interface

### CalendarPage
```typescript
// No props - gets calendarId from URL params
// Uses useCalendar hook internally
```

### DatePicker
```typescript
interface DatePickerProps {
  startDate: string;          // 'YYYY-MM-DD'
  endDate: string;            // 'YYYY-MM-DD'
  selectedDates: string[];    // Pending selection
  submittedDates: string[];   // Already submitted
  onDateRangeSelect: (start: Date, end: Date) => void;
}
```

### DateRangeDisplay
```typescript
interface DateRangeDisplayProps {
  dates: string[];            // Array of 'YYYY-MM-DD'
  onRemoveRange: (range: { start: string; end: string }) => void;
}
```

### ParticipantInput
```typescript
interface ParticipantInputProps {
  calendar: Calendar;         // Calendar data object
  currentParticipant: string;
  onParticipantChange: (name: string) => void;
}

interface Calendar {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  participantsType: 'defined' | 'open';
  participants?: string[];    // Only if defined
  requireEmailVerification?: boolean;
}
```

### AvailabilityView
```typescript
interface AvailabilityViewProps {
  calendar: Calendar;
  allUnavailability: {
    [date: string]: string[];  // { '2026-06-15': ['Alice', 'Bob'] }
  };
}
```

### CalendarCard
```typescript
interface CalendarCardProps {
  calendar: Calendar;
  onView: () => void;
  onShare: () => void;
  onDelete: () => void;
}
```

### Modal
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}
```

### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}
```

## State Management Strategy

### Local State (useState)
Use for component-specific data:
- Form input values
- Modal open/closed state
- Tab selection
- Loading states
- Error messages

### Context State
Use for app-wide data:
- Authentication (user, token)
- Language preference
- Theme (if added)

### URL State (React Router)
Use for shareable state:
- Calendar ID (in URL path)
- Active tab (could use query params)

### Server State (Custom Hooks)
Use for fetched data:
- Calendar data (useCalendar hook)
- Unavailability data
- User submissions

## Component Communication Patterns

### Parent → Child (Props)
```jsx
// Parent passes data down
<DatePicker 
  startDate={calendar.startDate}
  endDate={calendar.endDate}
/>
```

### Child → Parent (Callbacks)
```jsx
// Child calls parent's function
<DateRangeDisplay 
  onRemoveRange={(range) => handleRemove(range)}
/>
```

### Sibling → Sibling (Lift State Up)
```jsx
// Parent manages shared state
function CalendarPage() {
  const [selectedDates, setSelectedDates] = useState([]);
  
  return (
    <>
      <DatePicker onDateSelect={setSelectedDates} />
      <DateRangeDisplay dates={selectedDates} />
    </>
  );
}
```

### Global State (Context)
```jsx
// Any component accesses context
function MyComponent() {
  const { user, logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
}
```

## File Organization Best Practices

### Component File Structure
```jsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChildComponent from './ChildComponent';

// 2. Main Component
function MyComponent({ prop1, prop2 }) {
  // 2a. Hooks (always same order)
  const navigate = useNavigate();
  const [state, setState] = useState(initial);
  
  // 2b. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 2c. Event Handlers
  const handleClick = () => {
    // Handle event
  };
  
  // 2d. Computed Values
  const derivedValue = computeValue(state);
  
  // 2e. Render
  return (
    <div>
      <ChildComponent onClick={handleClick} />
    </div>
  );
}

// 3. Helper Functions (not using component state)
function helperFunction(arg) {
  return processedArg;
}

// 4. Export
export default MyComponent;
```

### Utils File Structure
```javascript
// src/utils/dateUtils.js

// Group related functions together
export function formatDateLocal(date) {
  // ...
}

export function formatDateDisplay(dateStr) {
  // ...
}

export function groupIntoRanges(dates) {
  // ...
}

// Can also export as object
export const dateUtils = {
  formatDateLocal,
  formatDateDisplay,
  groupIntoRanges
};
```

## Testing Strategy (Future)

### Unit Tests
Test individual components in isolation:
```javascript
// DateRangeDisplay.test.jsx
import { render, screen } from '@testing-library/react';
import DateRangeDisplay from './DateRangeDisplay';

test('shows empty message when no dates', () => {
  render(<DateRangeDisplay dates={[]} />);
  expect(screen.getByText(/No dates selected/i)).toBeInTheDocument();
});
```

### Integration Tests
Test component interactions:
```javascript
// CalendarPage.test.jsx
test('selecting date adds to list', async () => {
  render(<CalendarPage />);
  // Simulate date selection
  // Verify it appears in list
});
```

### E2E Tests
Test full user flows:
```javascript
// e2e/submit-unavailability.spec.js
test('user can submit unavailable dates', async () => {
  // Visit calendar page
  // Enter name
  // Select dates
  // Submit
  // Verify success message
});
```

## Performance Optimization Checklist

- [ ] Use `React.memo()` for expensive components
- [ ] Use `useMemo()` for expensive calculations
- [ ] Use `useCallback()` for event handlers passed as props
- [ ] Lazy load routes with `React.lazy()`
- [ ] Code split large dependencies
- [ ] Optimize images (WebP, proper sizing)
- [ ] Use virtual scrolling for long lists
- [ ] Debounce expensive operations
- [ ] Avoid inline object/function creation in render
- [ ] Profile with React DevTools

## Deployment Checklist

- [ ] Run production build: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Check bundle size
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Verify all API endpoints work
- [ ] Check loading states
- [ ] Check error states
- [ ] Verify SEO meta tags
- [ ] Test authentication flow
- [ ] Update README with new instructions
- [ ] Commit all changes
- [ ] Push to repository
- [ ] Deploy to Netlify
- [ ] Test production deployment
- [ ] Monitor for errors

---

This architecture provides a solid foundation for building scalable React components while maintaining the existing backend infrastructure. Start with the simple components and work your way up to more complex ones!

