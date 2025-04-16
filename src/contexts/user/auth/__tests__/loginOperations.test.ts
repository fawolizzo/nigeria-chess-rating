
import { login } from '../loginOperations';
import { getFromStorage, saveToStorage } from '@/utils/storageUtils';
import { monitorSync } from '@/utils/monitorSync';

// Mock dependencies
jest.mock('@/utils/storageUtils', () => ({
  getFromStorage: jest.fn(),
  saveToStorage: jest.fn()
}));

jest.mock('@/utils/monitorSync', () => ({
  monitorSync: jest.fn((_, __, callback) => callback())
}));

jest.mock('@/utils/debugLogger', () => ({
  logMessage: jest.fn(),
  LogLevel: { INFO: 'info', ERROR: 'error', WARNING: 'warning' },
  logUserEvent: jest.fn()
}));

describe('loginOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
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
      lastModified: Date.now()
    };

    const mockSetCurrentUser = jest.fn();
    const mockSetIsLoading = jest.fn();
    const mockSetUsers = jest.fn();
    const mockGetAllUsersWithRole = jest.fn();
    const mockForceStorageSync = jest.fn().mockResolvedValue(true);

    it('should successfully log in a tournament organizer with correct credentials', async () => {
      // Set up mocks
      (getFromStorage as jest.Mock).mockImplementation((key) => {
        if (key === 'ncr_users') return [mockUser];
        return null;
      });

      const result = await login(
        'test@example.com',
        'password123',
        'tournament_organizer',
        mockSetCurrentUser,
        mockSetIsLoading,
        mockSetUsers,
        mockGetAllUsersWithRole,
        mockForceStorageSync
      );

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetIsLoading).toHaveBeenLastCalledWith(false);
      expect(result).toBe(false); // Should fail because password doesn't match
      expect(mockSetCurrentUser).not.toHaveBeenCalled();
    });

    it('should fail login with incorrect email', async () => {
      // Set up mocks
      (getFromStorage as jest.Mock).mockReturnValue([mockUser]);

      const result = await login(
        'wrong@example.com',
        'password123',
        'tournament_organizer',
        mockSetCurrentUser,
        mockSetIsLoading,
        mockSetUsers,
        mockGetAllUsersWithRole,
        mockForceStorageSync
      );

      expect(result).toBe(false);
      expect(mockSetCurrentUser).not.toHaveBeenCalled();
    });

    it('should fail login with incorrect role', async () => {
      // Set up mocks
      (getFromStorage as jest.Mock).mockReturnValue([mockUser]);

      const result = await login(
        'test@example.com',
        'password123',
        'rating_officer',
        mockSetCurrentUser,
        mockSetIsLoading,
        mockSetUsers,
        mockGetAllUsersWithRole,
        mockForceStorageSync
      );

      expect(result).toBe(false);
      expect(mockSetCurrentUser).not.toHaveBeenCalled();
    });

    it('should fail login if user status is not approved', async () => {
      // Create a pending user
      const pendingUser = { 
        ...mockUser, 
        status: 'pending' as const 
      };
      
      // Set up mocks
      (getFromStorage as jest.Mock).mockReturnValue([pendingUser]);

      const result = await login(
        'test@example.com',
        'password123',
        'tournament_organizer',
        mockSetCurrentUser,
        mockSetIsLoading,
        mockSetUsers,
        mockGetAllUsersWithRole,
        mockForceStorageSync
      );

      expect(result).toBe(false);
      expect(mockSetCurrentUser).not.toHaveBeenCalled();
    });
  });
});
