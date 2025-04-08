
import { sendEmail } from '@/services/emailService';
import { logMessage, LogLevel } from '@/utils/debugLogger';

/**
 * Send an email to a user with error handling
 */
export const sendEmailToUser = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    return await sendEmail(to, subject, html);
  } catch (error) {
    logMessage(LogLevel.ERROR, 'EmailOperations', `Failed to send email to ${to}:`, error);
    return false;
  }
};
