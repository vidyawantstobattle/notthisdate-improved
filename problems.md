1. Lock in a Meeting Date

- Tried submitting same date in both date pickers --> possible loophole?
- After Submitting one date and keeping the other blank
Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
650bb2e9c8dc:1 Access to fetch at 'https://reverse-date-picker.netlify.app/.netlify/functions/set-finalized-date?id=650bb2e9c8dc' from origin 'http://localhost:8888' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
reverse-date-picker.netlify.app/.netlify/functions/set-finalized-date?id=650bb2e9c8dc:1  Failed to load resource: net::ERR_FAILED
CalendarPage.tsx:431 Failed to update finalized date: TypeError: Failed to fetch
    at fetchWithTimeout (apiClient.ts:15:28)
    at retryableFetch (apiClient.ts:34:28)
    at apiPost (apiClient.ts:66:26)
    at Object.post (client.ts:34:86)
    at Object.setFinalizedDate (calendars.api.ts:59:22)
    at handleSetFinalizedDate (CalendarPage.tsx:423:56)
    at async handleConfirm (AvailabilityView.tsx:207:5)

2. Description Box

- Double Enter Does Not Work As Expected
- makes the cursor go to the first line again or cut through existing text


3. Cannot see option at all to connect to google/apple/outlook calendar even when I am logged in nor when I am participating in the calendar as a logged out user. Ideally, after the user enters their name, the option to import dates from google/outlook/apple calendar should be there. In the view availability tab, once a date has been locked in, it should show the option to add the date to google / apple / outlook calendars