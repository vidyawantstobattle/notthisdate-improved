# NotThisDate 🗓️

A reverse-availability trip planner for coordinating group events. Instead of marking when you're available, everyone marks when they're **NOT** available!

## Features

- **Create Calendars**: Set up a date range and invite your group
- **Mark Unavailability**: Everyone marks when they CAN'T make it
- **Visual Grid**: See a color-coded view of group availability
- **Share Links**: Simple link sharing for participants
- **User Accounts**: Secure authentication via Netlify Identity

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Netlify Functions (serverless)
- **Database**: Netlify Blobs (key-value storage)
- **Authentication**: Netlify Identity
- **Design**: Stripe-inspired UI (purple primary #635bff)

## Live Demo

🌐 **https://reverse-date-picker.netlify.app/**

## Local Development

### Prerequisites

- Node.js (for npm)
- Python 3 (comes pre-installed on macOS)

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start local server:**
   ```bash
   npm start
   ```

3. **Open in browser:**
   ```
   http://localhost:8888
   ```

> **Note**: Authentication features require the deployed Netlify site. When running locally, the app connects to the production Netlify Identity endpoint.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start local server (Python http.server) |
| `npm run dev` | Start with Netlify CLI (if installed) |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run build` | No build step required |

## Testing

The project includes comprehensive unit and integration tests using Jest.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── setup.js              # Global test setup & mocks
├── unit/                 # Unit tests
│   ├── tagsInput.test.js
│   ├── passwordValidation.test.js
│   ├── calendarUtils.test.js
│   └── apiFunctions.test.js
└── integration/          # Integration tests
    ├── calendarCreation.test.js
    ├── unavailabilitySubmission.test.js
    └── authentication.test.js
```

See `tests/README.md` for detailed testing documentation.

## Project Structure

```
notthisdate-improved/
├── public/
│   ├── index.html       # Landing page + dashboard
│   ├── calendar.html    # Calendar view
│   ├── styles.css       # Stripe-inspired styles
│   ├── app.js           # Main app logic
│   └── calendar.js      # Calendar page logic
├── netlify/
│   └── functions/       # Serverless API endpoints
│       ├── create-calendar.mjs
│       ├── get-calendars.mjs
│       ├── get-calendar.mjs
│       ├── delete-calendar.mjs
│       ├── submit-unavailability.mjs
│       ├── get-unavailability.mjs
│       └── ...
├── .github/
│   └── copilot-instructions.md  # AI assistant context
├── netlify.toml         # Netlify configuration
├── package.json
└── README.md
```

## Design System

This app uses a **Stripe-inspired** design system:

| Element | Color |
|---------|-------|
| Primary (CTA, links) | `#635bff` |
| Text Primary | `#1a1f36` |
| Text Secondary | `#697386` |
| Success | `#30c67c` |
| Danger | `#df1b41` |
| Background | `#f6f9fc` |

**Typography**: System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)

See `.github/copilot-instructions.md` for full design documentation.

## Deployment

### Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify at https://app.netlify.com
3. **Enable Netlify Identity** in Site settings → Identity
4. Netlify auto-deploys on every push

### Required Netlify Setup

- ✅ Enable Netlify Identity (Site settings → Identity → Enable)
- ✅ Blobs storage is automatic with Netlify Functions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/.netlify/functions/create-calendar` | Create new calendar |
| GET | `/.netlify/functions/get-calendars` | Get user's calendars |
| GET | `/.netlify/functions/get-calendar?id=` | Get single calendar |
| DELETE | `/.netlify/functions/delete-calendar?id=` | Delete calendar |
| POST | `/.netlify/functions/submit-unavailability` | Submit unavailable dates |
| GET | `/.netlify/functions/get-unavailability?calendarId=` | Get unavailability |

## License

MIT
