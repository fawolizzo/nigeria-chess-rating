
import { 
  setupSystemTest, 
  teardownSystemTest, 
  generateTestData,
  simulateRegistration,
  simulateLogin
} from './setup';
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * System tests for the user registration and login flow
 */
const runRegistrationFlowTest = async (): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'SystemTest', '===== STARTING REGISTRATION FLOW TEST =====');
    
    // Setup test environment
    await setupSystemTest();
    
    // Generate test data
    const { ratingOfficer, organizer } = generateTestData();
    
    // Test registration for rating officer
    const officerRegistered = await simulateRegistration(ratingOfficer);
    if (!officerRegistered) {
      throw new Error('Rating officer registration failed');
    }
    
    // Test login for rating officer
    const officerLoggedIn = await simulateLogin(
      ratingOfficer.email, 
      ratingOfficer.accessCode!, 
      ratingOfficer.role
    );
    if (!officerLoggedIn) {
      throw new Error('Rating officer login failed');
    }
    
    // Test registration for tournament organizer
    const organizerRegistered = await simulateRegistration(organizer);
    if (!organizerRegistered) {
      throw new Error('Tournament organizer registration failed');
    }
    
    // Test login for tournament organizer (should fail while pending)
    const organizerLoggedInWhilePending = await simulateLogin(
      organizer.email, 
      organizer.password, 
      organizer.role
    );
    if (organizerLoggedInWhilePending) {
      throw new Error('Tournament organizer was able to log in while pending');
    }
    
    // Get users from storage to manipulate
    const users = JSON.parse(localStorage.getItem('ncr_users') || '[]');
    
    // Find and approve the tournament organizer
    const updatedUsers = users.map((user: any) => {
      if (user.email === organizer.email) {
        return { ...user, status: 'approved' };
      }
      return user;
    });
    
    // Save the updated users
    localStorage.setItem('ncr_users', JSON.stringify(updatedUsers));
    
    // Test login for tournament organizer after approval
    const organizerLoggedInAfterApproval = await simulateLogin(
      organizer.email, 
      organizer.password, 
      organizer.role
    );
    if (!organizerLoggedInAfterApproval) {
      throw new Error('Tournament organizer login failed after approval');
    }
    
    // Clean up
    await teardownSystemTest();
    
    logMessage(LogLevel.INFO, 'SystemTest', '===== REGISTRATION FLOW TEST PASSED =====');
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', '===== REGISTRATION FLOW TEST FAILED =====', error);
    await teardownSystemTest();
    return false;
  }
};

export { runRegistrationFlowTest };
