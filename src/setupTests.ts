
// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock BroadcastChannel
class BroadcastChannelMock {
  private channelName: string;
  private handlers: Array<(event: MessageEvent) => void> = [];

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  postMessage(message: any) {
    // Simulate posting a message
    const event = new MessageEvent('message', { data: message });
    this.handlers.forEach(handler => handler(event));
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void) {
    if (type === 'message') {
      this.handlers.push(handler);
    }
  }

  removeEventListener(type: string, handler: (event: MessageEvent) => void) {
    if (type === 'message') {
      const index = this.handlers.indexOf(handler);
      if (index !== -1) {
        this.handlers.splice(index, 1);
      }
    }
  }

  close() {
    this.handlers = [];
  }
}

// Set up mocks before each test
beforeEach(() => {
  // Setup localStorage mock
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  
  // Setup sessionStorage mock
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
  
  // Setup BroadcastChannel mock if needed in tests
  if (!('BroadcastChannel' in window)) {
    Object.defineProperty(window, 'BroadcastChannel', {
      value: BroadcastChannelMock
    });
  }

  // Clear storage before each test
  window.localStorage.clear();
  window.sessionStorage.clear();
});

// Add any other global mocks or setup needed for tests
