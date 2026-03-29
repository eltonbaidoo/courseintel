/**
 * Global setup for Chrome extension tests.
 * Stubs the chrome.* APIs that content scripts reference at import time.
 */

// Minimal chrome.runtime stub — only what scraper.ts needs at module load
(globalThis as any).chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
    },
    session: {
      get: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
};
