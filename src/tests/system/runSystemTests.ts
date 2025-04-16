
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { runRegistrationFlowTest } from "./registrationFlow.test";
import { runTournamentFlowTest } from "./tournamentFlow.test";
import { runPlayerApprovalFlowTest } from "./playerApprovalFlow.test";
import { runRatingCalculationFlowTest } from "./ratingCalculationFlow.test";

/**
 * Run all system tests and report results
 */
export const runAllSystemTests = async (): Promise<void> => {
  logMessage(LogLevel.INFO, 'SystemTest', '=========================================');
  logMessage(LogLevel.INFO, 'SystemTest', '======= STARTING ALL SYSTEM TESTS =======');
  logMessage(LogLevel.INFO, 'SystemTest', '=========================================');
  
  const results = {
    registrationFlow: false,
    tournamentFlow: false,
    playerApprovalFlow: false,
    ratingCalculationFlow: false
  };
  
  try {
    // Run registration flow test
    results.registrationFlow = await runRegistrationFlowTest();
    
    // Run tournament flow test
    results.tournamentFlow = await runTournamentFlowTest();
    
    // Run player approval flow test
    results.playerApprovalFlow = await runPlayerApprovalFlowTest();
    
    // Run rating calculation flow test
    results.ratingCalculationFlow = await runRatingCalculationFlowTest();
    
    // Calculate overall result
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const failedTests = totalTests - passedTests;
    
    // Report results
    logMessage(LogLevel.INFO, 'SystemTest', '=========================================');
    logMessage(LogLevel.INFO, 'SystemTest', '========== SYSTEM TEST SUMMARY ==========');
    logMessage(LogLevel.INFO, 'SystemTest', '=========================================');
    logMessage(LogLevel.INFO, 'SystemTest', `Total Tests: ${totalTests}`);
    logMessage(LogLevel.INFO, 'SystemTest', `Passed: ${passedTests}`);
    logMessage(LogLevel.INFO, 'SystemTest', `Failed: ${failedTests}`);
    logMessage(LogLevel.INFO, 'SystemTest', '=========================================');
    
    // Log individual test results
    Object.entries(results).forEach(([test, passed]) => {
      if (passed) {
        logMessage(LogLevel.INFO, 'SystemTest', `✅ ${test}: PASSED`);
      } else {
        logMessage(LogLevel.ERROR, 'SystemTest', `❌ ${test}: FAILED`);
      }
    });
    
    logMessage(LogLevel.INFO, 'SystemTest', '=========================================');
    logMessage(LogLevel.INFO, 'SystemTest', '======== SYSTEM TESTING COMPLETE ========');
    logMessage(LogLevel.INFO, 'SystemTest', '=========================================');
    
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', 'Unexpected error during system testing:', error);
  }
};

// Expose globally for dev console access
if (typeof window !== 'undefined') {
  (window as any).runSystemTests = runAllSystemTests;
}
