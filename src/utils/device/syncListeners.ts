import { SyncEventType } from '@/types/userTypes';

/**
 * Setup sync listeners for cross-tab communication
 * @param onReset Reset handler
 * @param onSync Sync handler
 * @param onLogin Login handler
 * @param onLogout Logout handler
 * @param onApproval Approval handler
 * @returns Cleanup function
 */
export const setupSyncListeners = (
  onReset: () => void,
  onSync: (data: any) => void,
  onLogin: (userData: any) => void,
  onLogout: () => void,
  onApproval: (userId: string) => void
): (() => void) => {
  const resetChannel = new BroadcastChannel('ncr_reset_channel');
  const syncChannel = new BroadcastChannel('ncr_sync_channel');

  // Handler for reset events
  const handleResetEvent = (event: MessageEvent) => {
    if (event.data && event.data.type === SyncEventType.RESET) {
      console.log('[syncListeners] Reset event received');
      onReset();
    }
  };

  // Handler for sync events
  const handleSyncEvent = (event: MessageEvent) => {
    if (!event.data) return;

    const { type, key, data } = event.data;

    switch (type) {
      case SyncEventType.SYNC:
      case SyncEventType.SYNC_REQUEST:
        console.log(`[syncListeners] Sync event received: ${type}`, key);
        onSync(event.data);
        break;
      case SyncEventType.LOGIN:
        console.log('[syncListeners] Login event received');
        onLogin(data);
        break;
      case SyncEventType.LOGOUT:
        console.log('[syncListeners] Logout event received');
        onLogout();
        break;
      case SyncEventType.APPROVAL:
        console.log('[syncListeners] Approval event received');
        onApproval(data);
        break;
      default:
        console.log(`[syncListeners] Unknown event type: ${type}`);
    }
  };

  // Add event listeners
  resetChannel.addEventListener('message', handleResetEvent);
  syncChannel.addEventListener('message', handleSyncEvent);

  // Return cleanup function
  return () => {
    resetChannel.removeEventListener('message', handleResetEvent);
    syncChannel.removeEventListener('message', handleSyncEvent);
    resetChannel.close();
    syncChannel.close();
    console.log('[syncListeners] Sync listeners removed');
  };
};
