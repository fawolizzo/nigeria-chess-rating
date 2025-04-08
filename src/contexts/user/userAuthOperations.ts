
/**
 * This file re-exports all auth operations for backward compatibility
 */

// Export all operation functions from their respective modules
export { loginUser } from './auth/loginOperations';
export { registerUser } from './auth/registerOperations';
export { 
  approveUserOperation, 
  rejectUserOperation, 
  getRatingOfficerEmailsOperation 
} from './auth/approvalOperations';
export { sendEmailToUser } from './auth/emailOperations';
