
// Add this window extension to TypeScript
declare global {
  interface Window {
    sendSyncEvent?: (type: string, key?: string, data?: any) => void;
  }
}

// This will be called from our tournament creation code
window.sendSyncEvent = (type, key, data) => {
  // Try using BroadcastChannel for cross-tab communication
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('ncr_sync_channel');
      channel.postMessage({
        type,
        key,
        data,
        timestamp: Date.now()
      });
      channel.close();
      console.log(`Sync event sent: ${type} for key ${key}`);
    }
    
    // Also trigger a storage event for older browsers
    if (key && typeof localStorage !== 'undefined') {
      const tempKey = `__sync_${Math.random()}`;
      localStorage.setItem(tempKey, Date.now().toString());
      localStorage.removeItem(tempKey);
    }
  } catch (error) {
    console.error("Error sending sync event:", error);
  }
};

export {};
