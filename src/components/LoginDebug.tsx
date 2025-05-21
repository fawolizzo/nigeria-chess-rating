import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { getFromStorage } from '@/utils/storageUtils';
import { User } from '@/types/userTypes';
import { supabase } from '@/integrations/supabase/client';

const LoginDebug = () => {
  // Only show in development mode
  const isProduction = import.meta.env.PROD;
  if (isProduction) return null;
  
  const [expanded, setExpanded] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [supabaseSessionState, setSupabaseSessionState] = useState<string>("checking");
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [currentUserFromStorage, setCurrentUserFromStorage] = useState<User | null>(null);
  const [browserStorageState, setBrowserStorageState] = useState<Record<string, boolean>>({
    localStorage: false,
    sessionStorage: false,
    indexedDB: false
  });

  useEffect(() => {
    if (expanded) {
      refreshUserData();
      checkStorageAvailability();
      checkSupabaseSession();
    }
  }, [expanded, refreshCount]);

  const refreshUserData = () => {
    try {
      // Get all users from storage
      const allUsers = getFromStorage<User[]>('ncr_users', []);
      
      // Filter to keep only unique users (based on email) and the official test account
      const uniqueUsers = allUsers.filter((user, index, self) => {
        // Keep only the first occurrence of each email
        const isFirstOccurrence = index === self.findIndex(u => u.email === user.email);
        
        // Always include the official test account, exclude other duplicates
        return user.email === "ncro@ncr.com" || 
              (user.email !== "ncro@ncr.com" && isFirstOccurrence);
      });
      
      // If we don't have the test account, make sure we add it
      const hasTestAccount = uniqueUsers.some(user => user.email === "ncro@ncr.com");
      
      setUsers(uniqueUsers);
      
      const currentUser = getFromStorage<User>('ncr_current_user', null);
      setCurrentUserFromStorage(currentUser);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const checkStorageAvailability = () => {
    // Check localStorage
    try {
      localStorage.setItem('ncr_test', 'test');
      localStorage.removeItem('ncr_test');
      setBrowserStorageState(prev => ({ ...prev, localStorage: true }));
    } catch (e) {
      setBrowserStorageState(prev => ({ ...prev, localStorage: false }));
    }
    
    // Check sessionStorage
    try {
      sessionStorage.setItem('ncr_test', 'test');
      sessionStorage.removeItem('ncr_test');
      setBrowserStorageState(prev => ({ ...prev, sessionStorage: true }));
    } catch (e) {
      setBrowserStorageState(prev => ({ ...prev, sessionStorage: false }));
    }
    
    // Check indexedDB
    try {
      const request = indexedDB.open('ncr_test', 1);
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase('ncr_test');
        setBrowserStorageState(prev => ({ ...prev, indexedDB: true }));
      };
      request.onerror = () => {
        setBrowserStorageState(prev => ({ ...prev, indexedDB: false }));
      };
    } catch (e) {
      setBrowserStorageState(prev => ({ ...prev, indexedDB: false }));
    }
  };

  const checkSupabaseSession = async () => {
    try {
      setSupabaseSessionState("checking");
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setSupabaseSessionState("error");
        console.error("Supabase session error:", error);
        return;
      }
      
      setSupabaseSession(data.session);
      setSupabaseUser(data.session?.user || null);
      setSupabaseSessionState(data.session ? "active" : "none");
    } catch (error) {
      setSupabaseSessionState("error");
      console.error("Error checking Supabase session:", error);
    }
  };

  return (
    <div className="mt-4 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900/50">
      <Button 
        variant="ghost" 
        className="w-full flex justify-between items-center p-3 text-xs"
        onClick={() => setExpanded(!expanded)}
      >
        <span>Login Debug Information</span>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </Button>
      
      {expanded && (
        <div className="p-3 text-xs font-mono">
          <div className="flex justify-between items-center mb-2">
            <div>Total Users: {users.length}</div>
            <Button
              variant="outline" 
              size="sm"
              className="text-xs p-1 h-6"
              onClick={() => setRefreshCount(c => c + 1)}
            >
              <RefreshCw size={12} className="mr-1" /> Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <h3 className="font-semibold mb-1">Browser Storage:</h3>
              <div className="ml-2">
                <div className={browserStorageState.localStorage ? "text-green-600" : "text-red-600"}>
                  localStorage: {browserStorageState.localStorage ? "Available" : "Unavailable"}
                </div>
                <div className={browserStorageState.sessionStorage ? "text-green-600" : "text-red-600"}>
                  sessionStorage: {browserStorageState.sessionStorage ? "Available" : "Unavailable"}
                </div>
                <div className={browserStorageState.indexedDB ? "text-green-600" : "text-red-600"}>
                  indexedDB: {browserStorageState.indexedDB ? "Available" : "Unavailable"}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <h3 className="font-semibold mb-1">Supabase Session:</h3>
              <div className="ml-2">
                <div className={supabaseSessionState === "active" ? "text-green-600" : 
                        supabaseSessionState === "none" ? "text-yellow-600" : "text-red-600"}>
                  Status: {supabaseSessionState}
                </div>
                {supabaseUser && (
                  <div>User: {supabaseUser.email}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="font-semibold">Rating Officers:</div>
            {users.filter(u => u.role === 'rating_officer').length === 0 && (
              <div className="text-red-500 ml-2">No rating officers found!</div>
            )}
            {users.filter(u => u.role === 'rating_officer').map((officer, idx) => (
              <div key={idx} className="ml-2 mb-1 p-1 border-b border-gray-200 dark:border-gray-700">
                <div><span className="text-blue-500">Email:</span> {officer.email}</div>
                <div><span className="text-blue-500">Status:</span> {officer.status}</div>
                <div><span className="text-blue-500">Has Password:</span> {officer.password ? "Yes" : "No"}</div>
                <div><span className="text-blue-500">Access Code:</span> {officer.accessCode || "RNCR25"}</div>
                <div className="flex gap-2 mt-1">
                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-[10px] px-1 rounded">
                    Use access code: {officer.accessCode || "RNCR25"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-2">
            <div className="font-semibold">Tournament Organizers:</div>
            {users.filter(u => u.role === 'tournament_organizer').length === 0 && (
              <div className="text-yellow-500 ml-2">No tournament organizers found.</div>
            )}
            {users.filter(u => u.role === 'tournament_organizer').map((organizer, idx) => (
              <div key={idx} className="ml-2 mb-1 p-1 border-b border-gray-200 dark:border-gray-700">
                <div><span className="text-blue-500">Email:</span> {organizer.email}</div>
                <div><span className="text-blue-500">Status:</span> {organizer.status}</div>
                <div><span className="text-blue-500">Has Password:</span> {organizer.password ? "Yes" : "No"}</div>
                {organizer.status === 'pending' && (
                  <div className="text-yellow-500 text-[10px] mt-1">
                    This account is pending approval
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-2">
            <div className="font-semibold">Current User from Storage:</div>
            {currentUserFromStorage ? (
              <div className="ml-2 p-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div><span className="text-blue-500">Email:</span> {currentUserFromStorage.email}</div>
                <div><span className="text-blue-500">Role:</span> {currentUserFromStorage.role}</div>
                <div><span className="text-blue-500">Status:</span> {currentUserFromStorage.status}</div>
              </div>
            ) : (
              <div className="text-yellow-500 ml-2">No current user in storage</div>
            )}
          </div>
          
          <div className="mt-3 text-gray-500 border-t pt-2 dark:border-gray-700">
            <div>Note: This debug panel is for development and testing purposes only.</div>
            <div className="mt-2 font-semibold">Login Tips:</div>
            <ul className="list-disc list-inside mt-1">
              <li>Rating Officers: Use email ncro@ncr.com with access code RNCR25</li>
              <li>Tournament Organizers: Use the password you created during registration or the default org@ncr.com account</li>
              <li>Only approved Tournament Organizers can log in</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDebug;
