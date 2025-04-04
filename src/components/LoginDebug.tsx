
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { getFromStorage } from '@/utils/storageUtils';
import { User } from '@/types/userTypes';

const LoginDebug = () => {
  const [expanded, setExpanded] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (expanded) {
      refreshUserData();
    }
  }, [expanded, refreshCount]);

  const refreshUserData = () => {
    const users = getFromStorage<User[]>('ncr_users', []);
    setUsers(users);
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
                <div><span className="text-blue-500">Access Code:</span> {officer.accessCode || "None"}</div>
                <div className="flex gap-2 mt-1">
                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-[10px] px-1 rounded">
                    Use access code: {officer.accessCode || "N/A"}
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
          
          <div className="mt-3 text-gray-500 border-t pt-2 dark:border-gray-700">
            <div>Note: This debug panel is for development and testing purposes only.</div>
            <div className="mt-2 font-semibold">Login Tips:</div>
            <ul className="list-disc list-inside mt-1">
              <li>Rating Officers: Use the access code shown above.</li>
              <li>Tournament Organizers: Use the password you created during registration.</li>
              <li>Only approved Tournament Organizers can log in.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDebug;
