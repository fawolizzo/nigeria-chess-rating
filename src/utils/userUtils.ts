
import { User, STORAGE_KEY_USERS } from "@/types/userTypes";
import { getFromStorage, saveToStorage } from "./storageUtils";

/**
 * Utility functions for working with user data
 */

// Function to get all users from storage
export const getAllUsersFromStorage = (): User[] => {
  return getFromStorage<User[]>(STORAGE_KEY_USERS, []);
};

// Function to save users to storage
export const saveUsersToStorage = (users: User[]): void => {
  saveToStorage(STORAGE_KEY_USERS, users);
};

// Function to get all rating officer emails
export const getRatingOfficerEmails = (users: User[]): string[] => {
  return users
    .filter(user => user.role === 'rating_officer' && user.status === 'approved')
    .map(user => user.email);
};

// Create an email template for organizer registration confirmation
export const createOrganizerConfirmationEmail = (userData: User): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #008751; margin-bottom: 20px;">Nigerian Chess Rating System - Registration Received</h2>
      <p>Dear ${userData.fullName},</p>
      <p>Thank you for registering as a Tournament Organizer with the Nigerian Chess Rating System.</p>
      <p>Your registration is currently <strong>pending approval</strong> by a Rating Officer. You will receive another email once your account has been approved.</p>
      <p>Registration details:</p>
      <ul>
        <li>Name: ${userData.fullName}</li>
        <li>Email: ${userData.email}</li>
        <li>State: ${userData.state}</li>
        <li>Registration Date: ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>If you have any questions, please contact our support team.</p>
      <p style="margin-top: 30px;">Best regards,<br>Nigerian Chess Rating System Team</p>
    </div>
  `;
};

// Create an email template for rating officer notification
export const createRatingOfficerNotificationEmail = (userData: User): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #008751; margin-bottom: 20px;">New Tournament Organizer Registration</h2>
      <p>A new Tournament Organizer has registered and is waiting for approval:</p>
      <ul>
        <li>Name: ${userData.fullName}</li>
        <li>Email: ${userData.email}</li>
        <li>State: ${userData.state}</li>
        <li>Registration Date: ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>Please log in to the Nigerian Chess Rating System to review and approve this registration.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="https://ncr-system.com/login" style="background-color: #008751; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Review</a>
      </div>
      <p>Thank you for your attention to this matter.</p>
    </div>
  `;
};

// Create an email template for account approval
export const createApprovalEmail = (user: User): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #008751; margin-bottom: 20px;">Account Approved - Nigerian Chess Rating System</h2>
      <p>Dear ${user.fullName},</p>
      <p>Congratulations! Your Tournament Organizer account has been approved.</p>
      <p>You can now log in to the Nigerian Chess Rating System and start creating tournaments.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="https://ncr-system.com/login" style="background-color: #008751; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login Now</a>
      </div>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p style="margin-top: 30px;">Best regards,<br>Nigerian Chess Rating System Team</p>
    </div>
  `;
};

// Create an email template for account rejection
export const createRejectionEmail = (user: User): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #d32f2f; margin-bottom: 20px;">Registration Not Approved - Nigerian Chess Rating System</h2>
      <p>Dear ${user.fullName},</p>
      <p>We regret to inform you that your application to become a Tournament Organizer has not been approved at this time.</p>
      <p>If you believe this is an error or would like more information, please contact our support team.</p>
      <p style="margin-top: 30px;">Best regards,<br>Nigerian Chess Rating System Team</p>
    </div>
  `;
};
