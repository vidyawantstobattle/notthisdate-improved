# React Component Building Checklist

Use this checklist as you build each component. Check off items as you complete them!

---

## 🎯 Component: DateRangeDisplay (EASIEST - START HERE!)

### Setup
- [ ] Open `src/components/DateRangeDisplay.jsx`
- [ ] Copy code from `REACT_SETUP_COMPLETE.md` lines 75-120
- [ ] Save file

### Integration
- [ ] Import in `CalendarPage.jsx`: `import DateRangeDisplay from '../components/DateRangeDisplay'`
- [ ] Add to CalendarPage JSX with props
- [ ] Test in browser at http://localhost:8888/c/test

### Verification
- [ ] Component renders without errors
- [ ] Shows "No dates selected" message when empty
- [ ] Displays date ranges when provided
- [ ] Remove button (×) appears on tags
- [ ] Clicking × calls onRemoveRange callback

**Reference:** `public/calendar.js` lines 481-509

---

## 🎯 Component: DatePicker

### Setup
- [ ] Create `src/components/DatePicker.jsx`
- [ ] Import Flatpickr: `import flatpickr from 'flatpickr'`
- [ ] Import CSS: `import 'flatpickr/dist/flatpickr.min.css'`

### Implementation
- [ ] Create component function with props
- [ ] Use useRef for DOM element: `const pickerRef = useRef(null)`
- [ ] Use useEffect to initialize Flatpickr
- [ ] Configure options (mode: 'range', inline: true, etc.)
- [ ] Implement onDayCreate to highlight dates
- [ ] Add cleanup in useEffect return
- [ ] Export component

### Integration
- [ ] Import in CalendarPage
- [ ] Add with required props (startDate, endDate, etc.)
- [ ] Wire up onDateRangeSelect callback
- [ ] Test date selection

### Verification
- [ ] Calendar displays inline
- [ ] Shows 2 months on desktop, 1 on mobile
- [ ] Can select date ranges
- [ ] Selected dates appear highlighted
- [ ] Submitted dates appear solid
- [ ] Callback fires with correct dates
- [ ] Range styling works (start, middle, end)

**Reference:** `public/calendar.js` lines 347-411

---

## 🎯 Component: ParticipantInput

### Setup
- [ ] Create `src/components/ParticipantInput.jsx`
- [ ] Plan three modes: defined, open, email verification

### Implementation - Defined Participants
- [ ] Check `calendar.participantsType === 'defined'`
- [ ] Render dropdown with participant names
- [ ] Add onChange handler
- [ ] Call onParticipantChange callback

### Implementation - Open Calendar
- [ ] Show name input field
- [ ] Add "Continue" button
- [ ] Validate name on submit
- [ ] Show confirmed name with edit button
- [ ] Allow changing name

### Implementation - Email Verification
- [ ] Step 1: Email & name input
- [ ] Generate verification code
- [ ] Step 2: Code input field
- [ ] Verify code on submit
- [ ] Store verified user in sessionStorage
- [ ] Show verified badge

### Integration
- [ ] Import in CalendarPage
- [ ] Pass calendar and callbacks
- [ ] Handle participant changes
- [ ] Test all three modes

### Verification
- [ ] Dropdown works for defined calendars
- [ ] Name entry works for open calendars
- [ ] Email verification flow works
- [ ] Can edit/change participant
- [ ] Current participant stored correctly

**Reference:** `public/calendar.js` lines 170-286

---

## 🎯 Component: AvailabilityView

### Setup
- [ ] Create `src/components/AvailabilityView.jsx`
- [ ] Plan sub-components: MonthCalendar, DateDetails

### Implementation - AvailabilityView
- [ ] Accept calendar and allUnavailability props
- [ ] Calculate date range months
- [ ] Map months to MonthCalendar components
- [ ] Add state for selectedDate
- [ ] Show DateDetails when date clicked

### Implementation - MonthCalendar
- [ ] Create calendar grid (7 columns)
- [ ] Add day headers (Sun-Sat)
- [ ] Calculate first day of month
- [ ] Render empty cells before 1st
- [ ] Render each day of month
- [ ] Mark out-of-range dates
- [ ] Color-code by unavailability
- [ ] Add click handlers

### Implementation - DateDetails
- [ ] Show date in readable format
- [ ] List unavailable people
- [ ] List available people
- [ ] Add close button
- [ ] Handle empty unavailability

### Helpers
- [ ] Create getAvailabilityColor function
- [ ] Create getAllParticipants function
- [ ] Calculate unavailability percentage

### Integration
- [ ] Import in CalendarPage
- [ ] Add to View tab
- [ ] Pass calendar and unavailability data
- [ ] Test on View tab

### Verification
- [ ] Month calendars render correctly
- [ ] Days show correct colors
- [ ] Out-of-range dates grayed out
- [ ] Clicking date shows details
- [ ] Unavailable/available lists correct
- [ ] Close button works
- [ ] Mobile responsive

**Reference:** `public/calendar.js` lines 744-882

---

## 🎯 Component: CalendarCreationForm

### Setup
- [ ] Create `src/components/CalendarCreationForm.jsx`
- [ ] Plan form fields structure

### Implementation
- [ ] Create form state with useState
- [ ] Add form fields (name, description, dates, participants)
- [ ] Add validation logic
- [ ] Implement handleSubmit
- [ ] Call API with fetch
- [ ] Handle success/error states
- [ ] Add loading state
- [ ] Clear form on success

### Form Fields
- [ ] Calendar name (required)
- [ ] Description (optional)
- [ ] Start date (required)
- [ ] End date (required)
- [ ] Participant type radio (defined/open)
- [ ] Participants list (if defined)
- [ ] Email verification checkbox

### Integration
- [ ] Import in LandingPage or Modal
- [ ] Add to dashboard
- [ ] Handle onSuccess callback
- [ ] Navigate to new calendar

### Verification
- [ ] All fields work
- [ ] Validation shows errors
- [ ] Can't submit invalid form
- [ ] API call succeeds
- [ ] Redirects to new calendar
- [ ] Shows success message

**Reference:** `public/app.js` form handling code

---

## 🎯 Component: CalendarCard

### Setup
- [ ] Create `src/components/CalendarCard.jsx`

### Implementation
- [ ] Accept calendar prop
- [ ] Display calendar name
- [ ] Display description
- [ ] Display date range
- [ ] Display participant count
- [ ] Add View button
- [ ] Add Share button
- [ ] Add Delete button
- [ ] Style with hover effects

### Integration
- [ ] Import in LandingPage
- [ ] Map over calendars array
- [ ] Pass callbacks for actions
- [ ] Add to calendars grid

### Verification
- [ ] Card displays all info correctly
- [ ] Hover effect works
- [ ] View button navigates to calendar
- [ ] Share button copies link
- [ ] Delete button shows confirmation
- [ ] Responsive layout

---

## 🎯 Component: Modal

### Setup
- [ ] Create `src/components/Modal.jsx`

### Implementation
- [ ] Accept isOpen, onClose, title, children props
- [ ] Return null if not open
- [ ] Create overlay div
- [ ] Create content div
- [ ] Add close button
- [ ] Stop propagation on content click
- [ ] Add escape key handler
- [ ] Prevent body scroll when open

### Styling
- [ ] Overlay: fixed position, full screen
- [ ] Backdrop: semi-transparent
- [ ] Content: centered, white background
- [ ] Close button: top-right corner
- [ ] Add animations (fade in)

### Integration
- [ ] Use for calendar creation
- [ ] Use for date details
- [ ] Use for confirmations

### Verification
- [ ] Opens when isOpen=true
- [ ] Closes on overlay click
- [ ] Closes on close button
- [ ] Closes on escape key
- [ ] Content doesn't close on click
- [ ] Body scroll prevented

---

## 🎯 Component: Button

### Setup
- [ ] Create `src/components/Button.jsx`

### Implementation
- [ ] Accept variant, size, disabled, onClick, children props
- [ ] Map variant to CSS classes
- [ ] Map size to CSS classes
- [ ] Handle disabled state
- [ ] Add proper button attributes
- [ ] Support icon rendering

### Variants
- [ ] primary (purple background)
- [ ] secondary (white with border)
- [ ] outline (transparent with border)
- [ ] danger (red)

### Sizes
- [ ] small (6px 12px)
- [ ] medium (10px 16px) - default
- [ ] large (12px 24px)

### Integration
- [ ] Replace button elements throughout
- [ ] Consistent styling everywhere

### Verification
- [ ] All variants render correctly
- [ ] All sizes work
- [ ] Disabled state works
- [ ] Hover effects work
- [ ] onClick fires correctly

---

## 🎯 Page: CalendarPage Complete

### State Management
- [ ] Add useState for selectedDates
- [ ] Add useState for submittedDates
- [ ] Add useState for currentParticipant
- [ ] Add useState for allUnavailability
- [ ] Add useState for activeTab
- [ ] Add useState for statusMessage

### Data Loading
- [ ] Use useCalendar hook for calendar data
- [ ] Load user submissions on participant change
- [ ] Load all unavailability for view tab
- [ ] Handle loading states
- [ ] Handle error states

### Submit Tab
- [ ] Integrate ParticipantInput
- [ ] Integrate DatePicker
- [ ] Integrate DateRangeDisplay
- [ ] Add submit button
- [ ] Add reset button
- [ ] Show status messages
- [ ] Show user submissions

### View Tab
- [ ] Integrate AvailabilityView
- [ ] Load unavailability data
- [ ] Show date details on click

### Event Handlers
- [ ] handleDateRangeSelect
- [ ] handleRemoveRange
- [ ] handleSubmit
- [ ] handleReset
- [ ] handleTabChange

### Verification
- [ ] All components integrated
- [ ] Data flows correctly
- [ ] Can select dates
- [ ] Can submit dates
- [ ] Can reset dates
- [ ] Can view availability
- [ ] All states work correctly

---

## 🎯 Page: LandingPage Complete

### Components Needed
- [ ] Hero section
- [ ] Auth buttons (login/signup)
- [ ] Dashboard section
- [ ] Calendars grid
- [ ] CalendarCard components
- [ ] Create calendar button/modal
- [ ] Empty state

### Implementation
- [ ] Use useAuth hook
- [ ] Show hero to all users
- [ ] Show auth buttons if not logged in
- [ ] Show dashboard if logged in
- [ ] Fetch user's calendars
- [ ] Display calendar cards
- [ ] Handle create calendar
- [ ] Handle delete calendar

### Verification
- [ ] Hero displays correctly
- [ ] Auth flow works
- [ ] Dashboard shows after login
- [ ] Calendars load correctly
- [ ] Can create new calendar
- [ ] Can view calendar
- [ ] Can delete calendar

---

## 🎯 Utils: Extract Helper Functions

### Date Utils (`src/utils/dateUtils.js`)
- [ ] formatDateLocal(date)
- [ ] formatDateDisplay(dateStr)
- [ ] formatDisplayDate(dateStr)
- [ ] groupIntoRanges(dates)
- [ ] getAdjacentDateStr(dateStr, offset)
- [ ] getRangePosition(dateStr, dateList)

### Validation Utils (`src/utils/validation.js`)
- [ ] isValidEmail(email)
- [ ] validateCalendarForm(data)
- [ ] validateDateRange(start, end)

### Other Utils (`src/utils/helpers.js`)
- [ ] escapeHtml(text)
- [ ] generateId()
- [ ] copyToClipboard(text)

---

## 🎯 Testing (Future)

### Unit Tests
- [ ] DateRangeDisplay.test.jsx
- [ ] DatePicker.test.jsx
- [ ] ParticipantInput.test.jsx
- [ ] AvailabilityView.test.jsx
- [ ] useCalendar.test.js

### Integration Tests
- [ ] Calendar submission flow
- [ ] Calendar creation flow
- [ ] Auth flow

### E2E Tests
- [ ] Complete user journey
- [ ] Mobile responsiveness
- [ ] Cross-browser testing

---

## 🎯 Polish & Deployment

### Polish
- [ ] Add loading spinners
- [ ] Add error boundaries
- [ ] Add toast notifications
- [ ] Improve mobile responsiveness
- [ ] Add animations/transitions
- [ ] Optimize images
- [ ] Add SEO meta tags
- [ ] Add analytics

### Optimization
- [ ] Code splitting
- [ ] Lazy loading routes
- [ ] Optimize bundle size
- [ ] Add service worker (PWA)
- [ ] Optimize re-renders

### Deployment
- [ ] Run `npm run build`
- [ ] Test production build
- [ ] Update README
- [ ] Deploy to Netlify
- [ ] Test production site
- [ ] Monitor for errors

---

## 📊 Progress Tracker

**Current Status:** Setup Complete ✅

**Next Up:** Build DateRangeDisplay

**Components:** 0/11 complete

**Progress:** ▯▯▯▯▯▯▯▯▯▯ 0%

Update this as you go!

---

## 💪 You Can Do This!

Start with DateRangeDisplay (code is ready in REACT_SETUP_COMPLETE.md), then work your way through this checklist. Each component builds on the previous ones. You've got comprehensive documentation and examples. Just take it one step at a time! 🚀

