
import { supabase } from "@/integrations/supabase/client";
import { saveToStorage, clearAllData } from "@/utils/storageUtils";
import { STORAGE_KEYS } from "@/contexts/user/userContextTypes";
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * System testing utilities for setting up and tearing down test environments
 */

export type TestUser = {
  email: string;
  password: string;
  role: "tournament_organizer" | "rating_officer";
  fullName: string;
  state: string;
  phoneNumber: string;
  id?: string;
  accessCode?: string;
  status?: "pending" | "approved" | "rejected";
};

// Test data generation
export const generateTestData = () => {
  // Generate unique IDs for this test run to avoid collisions
  const uniqueId = Date.now().toString().slice(-6);
  
  return {
    ratingOfficer: {
      email: `officer_${uniqueId}@test.com`,
      password: "Password123!",
      role: "rating_officer" as const,
      fullName: "Test Rating Officer",
      state: "Lagos",
      phoneNumber: "08012345678",
      accessCode: "RNCR25",
      status: "approved" as const
    },
    organizer: {
      email: `organizer_${uniqueId}@test.com`,
      password: "Password123!",
      role: "tournament_organizer" as const,
      fullName: "Test Tournament Organizer",
      state: "Abuja",
      phoneNumber: "08087654321",
      status: "pending" as const
    },
    testPlayers: [
      {
        name: "Player One",
        rating: 1800,
        nationalId: "NGR12345",
        state: "Lagos",
        status: "approved" as const
      },
      {
        name: "Player Two",
        rating: 2100,
        nationalId: "NGR67890",
        state: "Abuja",
        status: "approved" as const
      },
      {
        name: "Player Three",
        rating: 1500,
        nationalId: "NGR11223",
        state: "Kano",
        status: "pending" as const
      }
    ],
    testTournament: {
      name: `Test Tournament ${uniqueId}`,
      // Change from Date objects to ISO strings to match our updated code
      startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days later
      venue: "Test Venue",
      state: "Lagos",
      city: "Lagos",
      rounds: 5,
      timeControl: "90+30",
      registrationOpen: true,
      description: "Test Tournament Description", // Add description field
      status: "pending" as const // Changed from 'upcoming' to 'pending' to match allowed types
    }
  };
};

// System test setup
export const setupSystemTest = async (): Promise<void> => {
  try {
    logMessage(LogLevel.INFO, 'SystemTest', 'Setting up system test environment');
    
    // Clear any existing data
    await clearAllData();
    
    // Initialize empty data structures
    saveToStorage(STORAGE_KEYS.USERS, []);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, null);
    
    // Sign out of Supabase if signed in
    await supabase.auth.signOut();
    
    logMessage(LogLevel.INFO, 'SystemTest', 'System test environment ready');
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', 'Failed to set up test environment', error);
    throw error;
  }
};

// System test teardown
export const teardownSystemTest = async (): Promise<void> => {
  try {
    logMessage(LogLevel.INFO, 'SystemTest', 'Tearing down system test environment');
    
    // Sign out of Supabase
    await supabase.auth.signOut();
    
    // Clear storage but don't remove users for inspection
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    
    logMessage(LogLevel.INFO, 'SystemTest', 'System test environment cleaned up');
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', 'Failed to tear down test environment', error);
  }
};

// Helper to simulate user registration
export const simulateRegistration = async (user: TestUser): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'SystemTest', `Simulating registration for ${user.email} (${user.role})`);
    
    // For system testing, we'll actually use localStorage directly
    const existingUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Check if email already exists
    if (existingUsers.some((u: any) => u.email === user.email)) {
      logMessage(LogLevel.WARNING, 'SystemTest', `User ${user.email} already exists`);
      return false;
    }
    
    // Create user with system-generated ID
    const newUser = {
      ...user,
      id: `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      registrationDate: new Date().toISOString(),
      lastModified: Date.now(),
      status: user.status || (user.role === 'rating_officer' ? 'approved' : 'pending')
    };
    
    // Add to users array
    const updatedUsers = [...existingUsers, newUser];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    
    logMessage(LogLevel.INFO, 'SystemTest', `Registration successful for ${user.email}`);
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', `Registration failed for ${user.email}`, error);
    return false;
  }
};

// Helper to simulate user login
export const simulateLogin = async (email: string, password: string, role: "tournament_organizer" | "rating_officer"): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'SystemTest', `Simulating login for ${email} (${role})`);
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Find matching user
    const user = users.find((u: any) => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.role === role
    );
    
    if (!user) {
      logMessage(LogLevel.WARNING, 'SystemTest', `User ${email} (${role}) not found`);
      return false;
    }
    
    // For Rating Officer, check access code instead of password
    if (role === 'rating_officer' && user.accessCode !== password) {
      logMessage(LogLevel.WARNING, 'SystemTest', 'Invalid access code');
      return false;
    }
    
    // For Tournament Organizer, check password
    if (role === 'tournament_organizer' && user.password !== password) {
      logMessage(LogLevel.WARNING, 'SystemTest', 'Invalid password');
      return false;
    }
    
    // Set as current user
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    
    logMessage(LogLevel.INFO, 'SystemTest', `Login successful for ${email}`);
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', `Login failed for ${email}`, error);
    return false;
  }
};
