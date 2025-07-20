import { loginUser } from '../loginOperations';
import { monitorSync } from '@/utils/monitorSync';

// Mock dependencies
jest.mock('@/utils/storageUtils', () => ({
  getFromStorage: jest.fn(),
  saveToStorage: jest.fn(),
}));

jest.mock('@/utils/monitorSync', () => ({
  monitorSync: jest.fn((_, __, callback) => callback()),
}));

jest.mock('@/utils/debugLogger', () => ({
  logMessage: jest.fn(),
  LogLevel: { INFO: 'info', ERROR: 'error', WARNING: 'warning' },
  logUserEvent: jest.fn(),
}));

describe('loginOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      password: 'hashedpassword', // In real app this would be hashed
      fullName: 'Test User',
      role: 'tournament_organizer' as const,
      state: 'Lagos',
      city: 'Lagos',
      phone: '1234567890',
      status: 'approved' as const,
      registrationDate: '2023-01-01',
      lastModified: Date.now(),
    };

    const mockSetCurrentUser = jest.fn();
    const mockSetIsLoading = jest.fn();
    const mockSetUsers = jest.fn();
    const mockForceStorageSync = jest.fn().mockResolvedValue(true);

    it('should fail login with incorrect email', async () => {
      // Set up mocks
      (getFromStorage as jest.Mock).mockReturnValue([mockUser]);

      const result = await loginUser(
        'wrong@example.com',
        'password123',
        'tournament_organizer',
        mockSetUsers,
        mockSetCurrentUser,
        mockSetIsLoading,
        mockForceStorageSync
      );

      expect(result).toBe(false);
      expect(mockSetCurrentUser).not.toHaveBeenCalled();
    });

    it('should fail login with incorrect role', async () => {
      // Set up mocks
      (getFromStorage as jest.Mock).mockReturnValue([mockUser]);

      const result = await loginUser(
        'test@example.com',
        'password123',
        'rating_officer',
        mockSetUsers,
        mockSetCurrentUser,
        mockSetIsLoading,
        mockForceStorageSync
      );

      expect(result).toBe(false);
      expect(mockSetCurrentUser).not.toHaveBeenCalled();
    });

    it('should fail login if user status is not approved', async () => {
      // Create a pending user
      const pendingUser = {
        ...mockUser,
        status: 'pending' as const,
      };

      // Set up mocks
      (getFromStorage as jest.Mock).mockReturnValue([pendingUser]);

      const result = await loginUser(
        'test@example.com',
        'password123',
        'tournament_organizer',
        mockSetUsers,
        mockSetCurrentUser,
        mockSetIsLoading,
        mockForceStorageSync
      );

      expect(result).toBe(false);
      expect(mockSetCurrentUser).not.toHaveBeenCalled();
    });
  });
});
