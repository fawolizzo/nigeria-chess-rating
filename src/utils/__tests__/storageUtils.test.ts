
import { 
  saveToStorage, 
  getFromStorage, 
  removeFromStorage,
  clearAllData,
  syncStorage
} from '../storageUtils';

// Mock the detectPlatform function
jest.mock('../storageSync', () => ({
  detectPlatform: jest.fn(() => ({ type: 'desktop', details: 'test' })),
  sendSyncEvent: jest.fn()
}));

// Helper function to setup localStorage items
const setupLocalStorage = (items: Record<string, any>) => {
  localStorage.clear();
  Object.entries(items).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify({
      data: value,
      timestamp: Date.now(),
      deviceId: 'test-device',
      platform: 'desktop',
      version: 1
    }));
  });
};

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveToStorage', () => {
    it('should save data to localStorage and sessionStorage', () => {
      const testData = { name: 'Test User', email: 'test@example.com' };
      saveToStorage('test_key', testData);

      // Check localStorage
      const localStorageItem = localStorage.getItem('test_key');
      expect(localStorageItem).not.toBeNull();
      const parsedLocalData = JSON.parse(localStorageItem!);
      expect(parsedLocalData.data).toEqual(testData);

      // Check sessionStorage
      const sessionStorageItem = sessionStorage.getItem('test_key');
      expect(sessionStorageItem).not.toBeNull();
      const parsedSessionData = JSON.parse(sessionStorageItem!);
      expect(parsedSessionData.data).toEqual(testData);
    });

    it('should include metadata with the saved data', () => {
      saveToStorage('test_key', 'test_value');

      const localStorageItem = localStorage.getItem('test_key');
      const parsedData = JSON.parse(localStorageItem!);

      expect(parsedData).toHaveProperty('data', 'test_value');
      expect(parsedData).toHaveProperty('timestamp');
      expect(parsedData).toHaveProperty('deviceId');
      expect(parsedData).toHaveProperty('platform');
      expect(parsedData).toHaveProperty('version');
    });
  });

  describe('getFromStorage', () => {
    it('should prioritize sessionStorage over localStorage', () => {
      // Set up different data in local and session storage
      const localData = { source: 'localStorage' };
      const sessionData = { source: 'sessionStorage' };

      localStorage.setItem('test_key', JSON.stringify({
        data: localData,
        timestamp: Date.now(),
        deviceId: 'test-device',
        platform: 'desktop',
        version: 1
      }));

      sessionStorage.setItem('test_key', JSON.stringify({
        data: sessionData,
        timestamp: Date.now(),
        deviceId: 'test-device',
        platform: 'desktop',
        version: 2
      }));

      const result = getFromStorage('test_key', null);
      expect(result).toEqual(sessionData);
    });

    it('should fall back to localStorage if sessionStorage is empty', () => {
      const localData = { source: 'localStorage' };
      localStorage.setItem('test_key', JSON.stringify({
        data: localData,
        timestamp: Date.now(),
        deviceId: 'test-device',
        platform: 'desktop',
        version: 1
      }));

      const result = getFromStorage('test_key', null);
      expect(result).toEqual(localData);
    });

    it('should return the default value if neither storage has the key', () => {
      const defaultValue = { default: true };
      const result = getFromStorage('nonexistent_key', defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('removeFromStorage', () => {
    it('should remove data from both localStorage and sessionStorage', () => {
      // Set up test data
      localStorage.setItem('test_key', 'test_value');
      sessionStorage.setItem('test_key', 'test_value');

      removeFromStorage('test_key');

      expect(localStorage.getItem('test_key')).toBeNull();
      expect(sessionStorage.getItem('test_key')).toBeNull();
    });
  });

  describe('clearAllData', () => {
    it('should clear all data from localStorage and sessionStorage', async () => {
      // Set up test data
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      sessionStorage.setItem('key1', 'value1');
      sessionStorage.setItem('key2', 'value2');

      const result = await clearAllData();

      expect(result).toBe(true);
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('syncStorage', () => {
    it('should sync data from localStorage to sessionStorage', async () => {
      // Set data in localStorage only
      localStorage.setItem('test_key', JSON.stringify({
        data: { source: 'localStorage' },
        timestamp: Date.now(),
        deviceId: 'test-device',
        platform: 'desktop',
        version: 1
      }));

      await syncStorage(['test_key']);

      // Expect sessionStorage to now have the data
      const sessionItem = sessionStorage.getItem('test_key');
      expect(sessionItem).not.toBeNull();
      expect(JSON.parse(sessionItem!)).toEqual(JSON.parse(localStorage.getItem('test_key')!));
    });

    it('should sync data from sessionStorage to localStorage', async () => {
      // Set data in sessionStorage only
      sessionStorage.setItem('test_key', JSON.stringify({
        data: { source: 'sessionStorage' },
        timestamp: Date.now(),
        deviceId: 'test-device',
        platform: 'desktop',
        version: 2
      }));

      await syncStorage(['test_key']);

      // Expect localStorage to now have the data
      const localItem = localStorage.getItem('test_key');
      expect(localItem).not.toBeNull();
      expect(JSON.parse(localItem!)).toEqual(JSON.parse(sessionStorage.getItem('test_key')!));
    });
  });
});
