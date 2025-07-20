import { runTournamentFlowTest } from './tournamentFlow.test';
import { runRegistrationFlowTest } from './registrationFlow.test';
import { runPlayerApprovalFlowTest } from './playerApprovalFlow.test';
import { runRatingCalculationFlowTest } from './ratingCalculationFlow.test';

export const runSystemTests = async () => {
  console.log('🧪 Running system tests...');

  try {
    await runTournamentFlowTest();
    await runRegistrationFlowTest();
    await runPlayerApprovalFlowTest();
    await runRatingCalculationFlowTest();

    console.log('✅ All system tests completed');
  } catch (error) {
    console.error('❌ System tests failed:', error);
  }
};

// Legacy export for backward compatibility
export const runAllSystemTests = runSystemTests;
