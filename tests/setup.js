// Test setup file
// This runs before each test file

// Add custom jest matchers for DOM testing
require('@testing-library/jest-dom');

// Mock window.netlifyIdentity
global.netlifyIdentity = {
    on: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
    logout: jest.fn(),
    currentUser: jest.fn(() => ({
        jwt: jest.fn(() => Promise.resolve('mock-jwt-token'))
    })),
    init: jest.fn()
};

// Mock fetch
global.fetch = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(() => Promise.resolve())
    }
});

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    sessionStorageMock.clear();
    localStorageMock.clear();
    document.body.innerHTML = '';
});

