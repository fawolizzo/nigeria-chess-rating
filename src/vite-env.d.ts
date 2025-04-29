
/// <reference types="vite/client" />

// Declare global window properties for our app
interface Window {
  ncrIsResetting?: boolean;
  ncrForceSyncFunction?: (keys?: string[]) => Promise<boolean>;
  ncrClearAllData?: () => Promise<boolean>;
  ncrRunDiagnostics?: () => Record<string, any>;
}
