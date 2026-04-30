# NotThisDate - Copilot Instructions

## Project Overview

NotThisDate is a reverse-availability trip planner for coordinating group trips. Instead of marking when you're available, everyone marks when they're **NOT** available.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Netlify Functions (serverless)
- **Database**: Netlify Blobs (built-in key-value storage)
- **Authentication**: Netlify Identity
- **Hosting**: Netlify (deployed at https://reverse-date-picker.netlify.app/)

## Design System (Stripe-Inspired)

### Color Palette

```css
/* Primary Colors */
--primary-color: #635bff;      /* Stripe purple - main CTA, links, active states */
--primary-dark: #5248e5;       /* Hover state for primary */
--primary-light: #7a73ff;      /* Light accent */
--primary-bg: #f6f5ff;         /* Light purple background for tags, highlights */

/* Secondary / Text Colors */
--secondary-color: #0a2540;    /* Dark blue - headings, important text */
--text-primary: #1a1f36;       /* Main body text */
--text-secondary: #697386;     /* Secondary text, descriptions */
--text-muted: #8898aa;         /* Placeholder text, hints */

/* Status Colors */
--success-color: #30c67c;      /* Green - success states, submitted */
--success-bg: #d4edda;         /* Light green background */
--danger-color: #df1b41;       /* Red - errors, unavailable dates */
--danger-bg: #fef2f4;          /* Light red background */
--warning-color: #f7b32b;      /* Yellow - warnings */

/* Neutral Colors */
--bg-primary: #f6f9fc;         /* Page background */
--bg-white: #ffffff;           /* Card/modal backgrounds */
--border-color: #e6e9ec;       /* Borders, dividers */
--border-focus: #635bff;       /* Focus ring color */
```

### Typography

```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;

/* Font sizes follow Stripe's clean hierarchy */
/* Headings: 2.75rem (hero) -> 1.75rem (section) -> 1.5rem (page) -> 1.125rem (modal) -> 1rem (card) */
/* Body: 14px (default), 13px (small), 12px (hint) */
/* Letter spacing: -0.02em for large headings, -0.01em for medium */
```

### Shadows & Borders

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);   /* Cards at rest */
--shadow: 0 4px 12px rgba(0, 0, 0, 0.1);       /* Cards on hover, buttons */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);   /* Modals, dropdowns */

--radius-sm: 6px;    /* Small elements, tags */
--radius: 8px;       /* Buttons, inputs */
--radius-lg: 12px;   /* Cards, modals */
```

### Component Patterns

- **Buttons**: 10px 16px padding, 14px font, 500 weight, subtle hover lift (-1px translateY)
- **Inputs**: 10px 12px padding, 1px border, focus ring with 3px spread at 10% opacity
- **Cards**: 1.5rem padding, 1px border, hover changes border to primary color
- **Tags**: Pill-shaped (20px radius), primary-bg background, primary-color text
- **Modal backdrop**: rgba(26, 31, 54, 0.4) with 4px blur

## Development Environment

### Important Notes

- **The developer does NOT have `netlify-cli` or `npx` installed locally**
- For local development, use `npm start` which runs Python's built-in HTTP server
- Netlify Identity requires the production site URL when running locally

### Running Locally

```bash
# Install dependencies
npm install

# Start local server (uses Python 3 http.server)
npm start

# Open http://localhost:8888
```

### API Endpoints (Netlify Functions)

- `POST /.netlify/functions/create-calendar` - Create new calendar
- `GET /.netlify/functions/get-calendars` - Get user's calendars
- `GET /.netlify/functions/get-calendar?id=` - Get single calendar
- `DELETE /.netlify/functions/delete-calendar?id=` - Delete calendar
- `POST /.netlify/functions/submit-unavailability` - Submit unavailable dates
- `GET /.netlify/functions/get-unavailability?calendarId=` - Get unavailability data

## Code Patterns

### Authentication

```javascript
// Get auth headers for API calls
async function getAuthHeaders() {
    if (!currentUser) return {};
    const token = await netlifyIdentity.currentUser().jwt();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}
```

### Tags Input Component

Used for adding participants. Type name + Enter to add, click × to remove.

```javascript
const tagsInput = new TagsInput(container, {
    placeholder: 'Type a name and press Enter',
    onTagsChange: (tags) => console.log(tags)
});
const participants = tagsInput.getTags();
```

### Password Validation

Password requirements:
- At least 8 characters
- One uppercase letter
- One lowercase letter  
- One number
- One special character (!@#$%^&*(),.?":{}|<>)

## File Structure

```
/
├── public/
│   ├── index.html      # Main landing + dashboard
│   ├── calendar.html   # Calendar view page
│   ├── styles.css      # Stripe-inspired styles
│   ├── app.js          # Main app logic + TagsInput
│   └── calendar.js     # Calendar page logic
├── netlify/
│   └── functions/      # Serverless API endpoints
├── netlify.toml        # Netlify config
└── package.json
```
