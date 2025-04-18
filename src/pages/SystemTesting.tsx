
import React, { useEffect, useState } from 'react';
import { getAllLogs, exportLogsToFile, LogLevel } from '@/utils/debugLogger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const SystemTesting = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [storageData, setStorageData] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Fetch logs and refresh them periodically
  useEffect(() => {
    const fetchLogs = () => {
      try {
        const allLogs = getAllLogs();
        setLogs(allLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();

    // Check Supabase auth status
    const checkAuthStatus = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        setAuthStatus({
          hasSession: !!data.session,
          error: error ? error.message : null,
          session: data.session ? {
            expires_at: data.session.expires_at,
            user_id: data.session.user?.id,
            email: data.session.user?.email,
          } : null
        });
      } catch (e) {
        setAuthStatus({ error: e instanceof Error ? e.message : String(e) });
      }
    };

    checkAuthStatus();

    // Check storage data
    const checkStorageData = () => {
      try {
        const keys = ['ncr_users', 'ncr_current_user'];
        const data: Record<string, any> = {};

        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            data[key] = value ? JSON.parse(value) : null;
          } catch (e) {
            data[key] = `Error parsing: ${e instanceof Error ? e.message : String(e)}`;
          }
        });

        setStorageData(data);
      } catch (e) {
        setStorageData({ error: e instanceof Error ? e.message : String(e) });
      }
    };

    checkStorageData();

    // Set up refresh interval
    const intervalId = setInterval(() => {
      setRefreshCount(prev => prev + 1);
      fetchLogs();
      checkAuthStatus();
      checkStorageData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [refreshCount]);

  // Filter logs based on selected type
  useEffect(() => {
    if (logFilter === 'all') {
      setFilteredLogs(logs);
    } else if (logFilter === 'auth') {
      setFilteredLogs(logs.filter(log => 
        log.level === LogLevel.AUTH || 
        log.module.includes('Auth') || 
        log.message.includes('auth') ||
        log.module.includes('Login')
      ));
    } else if (logFilter === 'error') {
      setFilteredLogs(logs.filter(log => log.level === LogLevel.ERROR));
    } else if (logFilter === 'diagnostics') {
      setFilteredLogs(logs.filter(log => 
        log.level === LogLevel.DIAGNOSTICS || 
        log.message.includes('[DIAGNOSTICS]')
      ));
    }
  }, [logs, logFilter]);

  const handleExportLogs = () => {
    exportLogsToFile();
  };

  const handleClearStorage = () => {
    if (window.confirm('This will clear all local application data. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="container p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">System Diagnostics</h1>
      <p className="mb-6 text-gray-600">
        Use this page to diagnose authentication and system issues
        <Badge variant="outline" className="ml-2">Last refresh: {new Date().toLocaleTimeString()}</Badge>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current Supabase authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            {authStatus ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Session:</span>
                  <Badge variant={authStatus.hasSession ? "default" : "destructive"}>
                    {authStatus.hasSession ? "Active" : "None"}
                  </Badge>
                </div>
                {authStatus.error && (
                  <div className="text-red-500 text-sm">{authStatus.error}</div>
                )}
                {authStatus.session && (
                  <>
                    <div className="text-sm">
                      <span className="font-medium">User:</span> {authStatus.session.email || "Unknown"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Expires:</span> {new Date(authStatus.session.expires_at * 1000).toLocaleString()}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>Loading authentication status...</div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setRefreshCount(prev => prev + 1)}
              className="w-full"
            >
              Refresh Status
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Local Storage</CardTitle>
            <CardDescription>Data stored in browser storage</CardDescription>
          </CardHeader>
          <CardContent>
            {storageData ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Users Data:</span>
                  <Badge variant={storageData.ncr_users ? "default" : "destructive"}>
                    {storageData.ncr_users ? "Present" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Current User:</span>
                  <Badge variant={storageData.ncr_current_user ? "default" : "destructive"}>
                    {storageData.ncr_current_user ? "Present" : "Missing"}
                  </Badge>
                </div>
                {storageData.ncr_current_user && (
                  <div className="text-sm mt-2">
                    <div><span className="font-medium">Email:</span> {storageData.ncr_current_user.email}</div>
                    <div><span className="font-medium">Role:</span> {storageData.ncr_current_user.role}</div>
                    <div><span className="font-medium">Status:</span> {storageData.ncr_current_user.status}</div>
                  </div>
                )}
              </div>
            ) : (
              <div>Loading storage data...</div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleClearStorage}
              className="w-full"
            >
              Clear All Storage
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
            <CardDescription>Tools for troubleshooting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Total Logs:</span> {logs.length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Diagnostic Logs:</span> {
                  logs.filter(log => log.message.includes('[DIAGNOSTICS]') || log.level === LogLevel.DIAGNOSTICS).length
                }
              </div>
              <div className="text-sm">
                <span className="font-medium">Error Logs:</span> {
                  logs.filter(log => log.level === LogLevel.ERROR).length
                }
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportLogs}
              className="w-full"
            >
              Export Logs to File
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Go to Login Page
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 flex-wrap">
              <span>Diagnostic information from the application</span>
              <TabsList>
                <TabsTrigger value="all" onClick={() => setLogFilter('all')}>All</TabsTrigger>
                <TabsTrigger value="auth" onClick={() => setLogFilter('auth')}>Auth</TabsTrigger>
                <TabsTrigger value="diagnostics" onClick={() => setLogFilter('diagnostics')}>Diagnostics</TabsTrigger>
                <TabsTrigger value="error" onClick={() => setLogFilter('error')}>Errors</TabsTrigger>
              </TabsList>
              <span className="text-sm text-gray-500">Showing {filteredLogs.length} of {logs.length} logs</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full border rounded-md p-4">
            {filteredLogs.length > 0 ? (
              <div className="space-y-4">
                {filteredLogs.slice().reverse().map((log, index) => (
                  <div key={index} className="border-b pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={
                          log.level === LogLevel.ERROR ? "destructive" : 
                          log.level === LogLevel.WARNING ? "outline" :
                          "default"
                        }
                      >
                        {log.level}
                      </Badge>
                      <span className="text-sm font-medium">{log.module}</span>
                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.data && (
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {log.data}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">No logs found</div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 text-center">
        System Testing & Diagnostics Page - {new Date().toLocaleDateString()}<br />
        <a href="/" className="text-blue-500 hover:underline">Return to Home</a>
      </div>
    </div>
  );
};

export default SystemTesting;
