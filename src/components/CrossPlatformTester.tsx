import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  runStorageDiagnostics, 
  detectPlatform,
  checkCrossPlatformCompatibility,
  forceSyncAllStorage
} from "@/utils/storageSync";
import { LogLevel, logMessage } from '@/utils/debugLogger';
import { SyncEventType } from '@/types/userTypes';
import { useUser } from '@/contexts/UserContext';
import SyncStatusIndicator from './SyncStatusIndicator';
import { RefreshCw, Smartphone, Tablet, Laptop, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface DiagnosticResults {
  platform: {
    type: string;
    details: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    userAgent: string;
  };
  storageStats: Record<string, any>;
  compatibility: Record<string, any>;
  timestamp: string;
}

const CrossPlatformTester: React.FC = () => {
  const { toast } = useToast();
  const { currentUser, refreshUserData } = useUser();
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  useEffect(() => {
    // Run initial checks
    runDiagnostics();
  }, []);
  
  const runDiagnostics = async () => {
    setIsRunningTests(true);
    
    try {
      const platform = detectPlatform();
      const storageStats = runStorageDiagnostics();
      const compatibility = await checkCrossPlatformCompatibility();
      
      const diagnosticResults: DiagnosticResults = {
        platform,
        storageStats,
        compatibility,
        timestamp: new Date().toISOString()
      };
      
      setResults(diagnosticResults);
      
      logMessage(LogLevel.INFO, 'CrossPlatformTester', `Diagnostics completed on ${platform.type}`, diagnosticResults);
      
      toast({
        title: "Diagnostics Complete",
        description: `Platform detected: ${platform.type} (${platform.details || 'generic'})`,
      });
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        title: "Diagnostics Failed",
        description: "There was an error running the cross-platform tests.",
        variant: "destructive"
      });
    } finally {
      setIsRunningTests(false);
    }
  };
  
  const forceDataSync = async () => {
    setIsRunningTests(true);
    
    try {
      const platform = detectPlatform();
      logMessage(LogLevel.INFO, 'CrossPlatformTester', `Force sync initiated from ${platform.type}`);
      
      const result = await forceSyncAllStorage();
      await refreshUserData();
      
      setLastSyncTime(new Date());
      
      toast({
        title: result ? "Sync Successful" : "Sync Issues Detected",
        description: result 
          ? "Data synchronized successfully across platforms" 
          : "There were some issues with the sync process",
        variant: result ? "default" : "destructive"
      });
      
      logMessage(LogLevel.INFO, 'CrossPlatformTester', `Force sync completed on ${platform.type}`, { success: result });
    } catch (error) {
      console.error('Error during force sync:', error);
      toast({
        title: "Sync Failed",
        description: "There was an error syncing data across platforms.",
        variant: "destructive"
      });
    } finally {
      setIsRunningTests(false);
    }
  };
  
  const getPlatformIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-6 w-6" />;
      case 'tablet':
        return <Tablet className="h-6 w-6" />;
      case 'desktop':
        return <Laptop className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };
  
  const getStatusBadge = (isSupported: boolean) => {
    return isSupported ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" /> Supported
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <AlertCircle className="h-3 w-3 mr-1" /> Not Supported
      </Badge>
    );
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cross-Platform Test Tool</CardTitle>
            <CardDescription>Test the rating system across different devices</CardDescription>
          </div>
          {results && (
            <Badge className="ml-2" variant="outline">
              {getPlatformIcon(results.platform.type)}
              <span className="ml-1 capitalize">{results.platform.type}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="diagnostics">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="sync">Data Sync</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnostics">
            {results ? (
              <div className="space-y-4 mt-4">
                <div className="rounded-md bg-muted p-4">
                  <h3 className="font-medium mb-2">Platform Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Device Type:</div>
                    <div className="font-medium capitalize">{results.platform.type}</div>
                    
                    <div className="text-muted-foreground">Details:</div>
                    <div className="font-medium">{results.platform.details || 'Generic'}</div>
                    
                    <div className="text-muted-foreground">User Agent:</div>
                    <div className="text-xs truncate" title={results.platform.userAgent}>
                      {results.platform.userAgent.substring(0, 40)}...
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md bg-muted p-4">
                  <h3 className="font-medium mb-2">Compatibility Results</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Local Storage</span>
                      {getStatusBadge(results.compatibility.storageAvailable)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Session Storage</span>
                      {getStatusBadge(results.compatibility.sessionStorageAvailable)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">BroadcastChannel API</span>
                      {getStatusBadge(results.compatibility.broadcastChannelSupport)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">IndexedDB</span>
                      {getStatusBadge(results.compatibility.indexedDBSupport)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Service Worker</span>
                      {getStatusBadge(results.compatibility.serviceWorkerSupport)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Offline Detection</span>
                      {getStatusBadge(results.compatibility.offlineCapability)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-40">
                <Button 
                  variant="outline" 
                  onClick={runDiagnostics} 
                  disabled={isRunningTests}
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Diagnostics
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="storage">
            {results ? (
              <div className="space-y-4 mt-4">
                <div className="rounded-md bg-muted p-4">
                  <h3 className="font-medium mb-2">Storage Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Items in localStorage:</div>
                    <div className="font-medium">{results.storageStats.storageItemCount}</div>
                    
                    <div className="text-muted-foreground">Items in sessionStorage:</div>
                    <div className="font-medium">{results.storageStats.sessionItemCount}</div>
                    
                    <div className="text-muted-foreground">Estimated Storage Usage:</div>
                    <div className="font-medium">{results.storageStats.estimatedStorageUsage}</div>
                    
                    <div className="text-muted-foreground">Device ID:</div>
                    <div className="font-medium">{results.storageStats.deviceId}</div>
                  </div>
                </div>
                
                <div className="rounded-md bg-muted p-4">
                  <h3 className="font-medium mb-2">Storage Keys</h3>
                  <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                    {results.storageStats.keys.map((key: string, index: number) => (
                      <div key={index} className="text-muted-foreground truncate" title={key}>{key}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-40">
                <Button 
                  variant="outline" 
                  onClick={runDiagnostics} 
                  disabled={isRunningTests}
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Storage
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sync">
            <div className="space-y-4 mt-4">
              <div className="rounded-md bg-muted p-4">
                <h3 className="font-medium mb-2">Data Synchronization</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test data synchronization between devices. When you click "Force Sync", 
                  data will be synchronized across all instances of the application.
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current User:</span>
                    <span className="text-sm font-medium">
                      {currentUser ? currentUser.email : 'Not logged in'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Sync:</span>
                    <span className="text-sm font-medium">
                      {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  
                  {results && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Platform:</span>
                      <span className="text-sm font-medium capitalize">
                        {results.platform.type} ({results.platform.details || 'generic'})
                      </span>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={forceDataSync} 
                  disabled={isRunningTests}
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Sync Now
                    </>
                  )}
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Sync Status</h3>
                <SyncStatusIndicator 
                  onSyncComplete={() => setLastSyncTime(new Date())}
                  prioritizeUserData={true}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          {results ? `Last check: ${new Date(results.timestamp).toLocaleTimeString()}` : 'No diagnostics run yet'}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={runDiagnostics} 
          disabled={isRunningTests}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CrossPlatformTester;
