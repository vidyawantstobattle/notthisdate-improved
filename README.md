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

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:8888
   ```

> **Note**: Authentication features require the deployed Netlify site. When running locally, the app connects to the production Netlify Identity endpoint.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-safe production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run netlify-dev` | Start with Netlify CLI (if installed) |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

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
├── src/                 # React app (sole frontend; built by Vite)
│   ├── index.html       # Single HTML entry point
│   ├── index.tsx
│   ├── api/             # Only layer that knows endpoint paths
│   ├── core/            # Framework-agnostic pure logic
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── styles/index.css # Imports the partials in public/styles/
├── public/              # Static assets consumed by the React build
│   ├── images/
│   ├── locales/         # i18n JSON, bundled via import.meta.glob
│   ├── styles/          # Modular CSS partials
│   ├── robots.txt
│   └── sitemap.xml
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
├── vite.config.js
├── package.json
└── README.md
```

## Languages (i18n)

### Turning a language on or off

Every language in the dropdown is driven by one array in **`src/config/languages.ts`**:

```ts
// What the dropdown offers, in display order. Comment a line out to hide it.
const ENABLED_LANGUAGES: LanguageCode[] = [
  'en',
  // 'nl',      <-- THIS is the line to comment out to disable Dutch
  'mr'
];
```

| Goal | What to do |
|------|------------|
| **Disable NL (Dutch)** | Comment out the `'nl',` line (it ships commented out today) |
| **Re-enable NL** | Uncomment `'nl',`; nothing else needs changing |
| **Reorder the dropdown** | Reorder the entries in the array |

Commenting a language out **only hides it from the dropdown**. Its `LANGUAGE_REGISTRY`
entry, its locale files, and its bundled catalog all stay in place, so `'nl'` remains a
valid value for `setLang()` and `t()`. Anyone whose saved preference was a
now-disabled language falls back to the default automatically.

### Where the wording lives

Translations are plain JSON under **`public/locales/<language-code>/`**:

| Language | Folder |
|----------|--------|
| English | `public/locales/en/` |
| Dutch | `public/locales/nl/` |
| Marathi | `public/locales/mr/` |

Each folder holds one file per area of the site, so a translator can work on one part at a time:

| File | Covers |
|------|--------|
| `common.json` | Shared buttons, loading text, error titles/messages |
| `header.json` | Top navigation |
| `footer.json` | Footer |
| `landing.json` | Landing page |
| `about.json` | About page |
| `dashboard.json` | Dashboard, create-calendar and edit-participants modals |
| `calendarShell.json` | Calendar page frame |
| `calendarSubmit.json` | Date-submission form and date picker |
| `calendarView.json` | Availability grid |

**English is the source of truth.** Any key missing from another language falls back to
`en`, then to the key itself, so a partial translation file is safe to ship. Today
`nl/` and `mr/` only contain `header.json` and `footer.json`; everything else renders in
English until those files are added.

### Adding a new language

1. Add an entry to `LANGUAGE_REGISTRY` in `src/config/languages.ts` (code + dropdown label).
2. Create `public/locales/<code>/` and copy the JSON files from `public/locales/en/` as a starting point.
3. Add the code to `ENABLED_LANGUAGES`.

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
