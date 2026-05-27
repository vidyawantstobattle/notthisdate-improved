# React Migration Guide

This document explains the React component architecture for NotThisDate.

## Build Setup

### Development
```bash
npm run dev
```
This starts Vite dev server at http://localhost:8888 with hot module replacement.

### Production Build
```bash
npm run build
```
This creates an optimized production build in the `dist` folder.

### Preview Production Build
```bash
npm run preview
```

## Component Architecture

### Core Components

#### 1. **DatePicker** (`src/components/DatePicker.jsx`)
Wraps Flatpickr for date range selection with visual feedback.

**Props:**
- `startDate`: Calendar start date (YYYY-MM-DD)
- `endDate`: Calendar end date (YYYY-MM-DD)
- `selectedDates`: Array of pending selected dates
- `submittedDates`: Array of already submitted dates
- `onDateRangeSelect`: Callback when user selects a date range

**Features:**
- Inline calendar display (1 month on mobile, 2 on desktop)
- Visual highlighting for selected/submitted dates
- Range position styling (start, middle, end, single)

#### 2. **DateRangeDisplay** (`src/components/DateRangeDisplay.jsx`)
Displays selected date ranges as removable tags.

**Props:**
- `dates`: Array of date strings
- `onRemoveRange`: Callback when user removes a range

**Features:**
- Groups consecutive dates into ranges
- Click X to remove individual ranges
- Empty state message

#### 3. **ParticipantInput** (`src/components/ParticipantInput.jsx`)
Handles participant identification based on calendar type.

**Props:**
- `calendar`: Calendar data object
- `currentParticipant`: Current participant name
- `onParticipantChange`: Callback when participant changes

**Features:**
- **Defined participants**: Dropdown selector
- **Open calendar**: Name entry with confirmation
- **Email verification**: Two-step verification flow

#### 4. **AvailabilityView** (`src/components/AvailabilityView.jsx`)
Shows aggregated availability across all participants.

**Props:**
- `calendar`: Calendar data object
- `allUnavailability`: Object mapping dates to unavailable participants

**Features:**
- Month-by-month calendar grid
- Color-coded availability (green = available, gray = unavailable)
- Click dates to see details
- Out-of-range dates grayed out

### Pages

#### **CalendarPage** (`src/pages/CalendarPage.jsx`)
Main calendar interaction page. Handles:
- Loading calendar data
- Tab switching (Submit / View)
- Date selection and submission
- Reset functionality

#### **LandingPage** (`src/pages/LandingPage.jsx`)
Home page with authentication and dashboard (placeholder).

### Context Providers

#### **AuthContext** (`src/context/AuthContext.jsx`)
Manages Netlify Identity authentication.

**Exports:**
- `useAuth()` hook

**Methods:**
- `login()`: Open login modal
- `signup()`: Open signup modal
- `logout()`: Log out user
- `getAuthHeaders()`: Get auth headers for API calls

#### **LanguageContext** (`src/context/LanguageContext.jsx`)
Manages i18n translations (placeholder).

### Custom Hooks

#### **useCalendar** (`src/hooks/useCalendar.js`)
Fetches calendar data by ID.

**Returns:**
```javascript
{
  calendar: object | null,
  loading: boolean,
  error: string | null
}
```

## Styling

The design system follows Stripe-inspired principles:
- **Primary color**: `#635bff` (Stripe purple)
- **Shadows**: Subtle elevation with hover effects
- **Borders**: Rounded corners (8px standard)
- **Typography**: System font stack

All styles are in `src/styles/index.css` and import the original `public/styles.css`.

## API Integration

All components use the existing Netlify Functions:
- `/.netlify/functions/get-calendar?id=`
- `/.netlify/functions/submit-unavailability`
- `/.netlify/functions/get-user-submissions`
- `/.netlify/functions/get-unavailability`
- `/.netlify/functions/reset-unavailability`

## Migration Checklist

- [x] Set up Vite build tool
- [x] Create React component structure
- [x] Port DatePicker functionality
- [x] Port Participant input logic
- [x] Port Availability calendar
- [x] Implement routing
- [x] Add AuthContext for Netlify Identity
- [ ] Port landing page dashboard
- [ ] Port calendar creation form
- [ ] Add form validation components
- [ ] Add loading states and error boundaries
- [ ] Add unit tests for components
- [ ] Add integration tests
- [ ] Update SEO meta tags dynamically
- [ ] Add analytics tracking

## Next Steps

1. **Create CalendarCreation component** for the create calendar flow
2. **Build Dashboard component** to display user's calendars
3. **Add error boundaries** for better error handling
4. **Implement proper loading states** with skeleton screens
5. **Add React Testing Library tests**
6. **Optimize bundle size** with code splitting
7. **Add Suspense and lazy loading** for better performance

## Example Usage

### Using DatePicker Component

```jsx
import DatePicker from '../components/DatePicker';

function MyComponent() {
  const [selectedDates, setSelectedDates] = useState([]);

  const handleDateSelect = (start, end) => {
    // Add dates from start to end
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }
    setSelectedDates([...selectedDates, ...dates]);
  };

  return (
    <DatePicker
      startDate="2026-06-01"
      endDate="2026-08-31"
      selectedDates={selectedDates}
      submittedDates={[]}
      onDateRangeSelect={handleDateSelect}
    />
  );
}
```

### Using useCalendar Hook

```jsx
import { useCalendar } from '../hooks/useCalendar';

function MyComponent() {
  const { calendar, loading, error } = useCalendar('abc123');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!calendar) return null;

  return <div>{calendar.name}</div>;
}
```

## File Structure

```
src/
├── components/          # Reusable React components
│   ├── DatePicker.jsx
│   ├── DateRangeDisplay.jsx
│   ├── ParticipantInput.jsx
│   └── AvailabilityView.jsx
├── pages/              # Route-level components
│   ├── LandingPage.jsx
│   └── CalendarPage.jsx
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   └── LanguageContext.jsx
├── hooks/              # Custom React hooks
│   └── useCalendar.js
├── styles/             # CSS files
│   └── index.css
├── utils/              # Utility functions
├── App.jsx            # Main app component with routes
├── index.jsx          # React entry point
└── index.html         # HTML template
```

