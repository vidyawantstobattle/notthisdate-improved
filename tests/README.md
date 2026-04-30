# NotThisDate Tests

This directory contains unit and integration tests for the NotThisDate application.

## Test Structure

```
tests/
├── setup.js                           # Jest setup and global mocks
├── unit/
│   ├── tagsInput.test.js             # TagsInput component tests
│   ├── passwordValidation.test.js    # Password validation rules tests
│   ├── calendarUtils.test.js         # Calendar utility functions tests
│   └── apiFunctions.test.js          # API function logic tests
└── integration/
    ├── calendarCreation.test.js      # Calendar creation flow tests
    ├── unavailabilitySubmission.test.js  # Unavailability submission flow tests
    └── authentication.test.js        # Authentication flow tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- tests/unit/tagsInput.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="TagsInput"
```

## Test Categories

### Unit Tests

Unit tests verify individual functions and components in isolation:

- **TagsInput Component** - Tests the tag input UI component for adding/removing participants
- **Password Validation** - Tests password strength rules and validation logic
- **Calendar Utilities** - Tests date formatting, grouping, and utility functions
- **API Functions** - Tests the logic of Netlify Functions without network calls

### Integration Tests

Integration tests verify how components work together:

- **Calendar Creation** - Tests the complete flow from form to API call
- **Unavailability Submission** - Tests participant selection, date selection, and submission
- **Authentication** - Tests Netlify Identity integration and auth state management

## Mocks

The test setup (`setup.js`) provides the following global mocks:

- `netlifyIdentity` - Mocked Netlify Identity widget
- `fetch` - Mocked fetch for API calls
- `navigator.clipboard` - Mocked clipboard API
- `sessionStorage` / `localStorage` - Mocked web storage

## Writing New Tests

### Unit Test Example
```javascript
describe('MyFunction', () => {
    test('should do something specific', () => {
        const result = myFunction('input');
        expect(result).toBe('expected output');
    });
});
```

### Integration Test Example
```javascript
describe('Feature Flow', () => {
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `<div id="app"></div>`;
        
        // Setup mocks
        global.fetch = jest.fn();
    });

    test('should complete the flow', async () => {
        // Arrange
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
        
        // Act
        await someAction();
        
        // Assert
        expect(fetch).toHaveBeenCalled();
    });
});
```

## Coverage

To generate a coverage report:

```bash
npm run test:coverage
```

This creates a `coverage/` directory with HTML reports.

### Coverage Targets
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Troubleshooting

### Tests failing with "ReferenceError: document is not defined"
Ensure Jest is configured with `testEnvironment: 'jsdom'` in `package.json`.

### Mock not working
Check that mocks are reset in `beforeEach` using `jest.clearAllMocks()`.

### Async test timing out
Increase timeout with `jest.setTimeout(10000)` or add `done` callback.
