
import { detectPlatform } from "../storageSync";

/**
 * Generate a unique device ID or retrieve the existing one
 * @returns The device ID string
 */
export const ensureDeviceId = (): string => {
  let deviceId = localStorage.getItem('ncr_device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('ncr_device_id', deviceId);
    sessionStorage.setItem('ncr_device_id', deviceId);
    
    // Log platform info with new device ID
    const platform = detectPlatform();
    console.log(`New device ID generated: ${deviceId} on ${platform.type} platform (${platform.details})`);
  }
  return deviceId;
};

/**
 * Generate a unique device ID 
 * @returns A unique device identifier
 */
export const generateDeviceId = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  const platform = detectPlatform();
  
  // Create components for the device fingerprint
  const components = [
    nav.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    platform.type,
    platform.details,
    Math.random().toString(36).substring(2, 15) // Add some randomness
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Include platform type in device ID for easier identification
  return `${platform.type}_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
};
