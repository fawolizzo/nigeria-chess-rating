
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getFromStorage } from '@/utils/storageUtils';

const LoginDebug = () => {
  const [expanded, setExpanded] = useState(false);

  const getUserData = () => {
    const users = getFromStorage('ncr_users', []);
    const currentUser = getFromStorage('ncr_current_user', null);
    
    return {
      totalUsers: Array.isArray(users) ? users.length : 0,
      ratingOfficers: Array.isArray(users) ? users.filter((u: any) => u.role === 'rating_officer').length : 0,
      currentUser: currentUser ? {
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status,
        hasAccessCode: !!currentUser.accessCode
      } : null
    };
  };

  const data = getUserData();

  return (
    <div className="mt-4 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900/50">
      <Button 
        variant="ghost" 
        className="w-full flex justify-between items-center p-3 text-xs"
        onClick={() => setExpanded(!expanded)}
      >
        <span>Debug Information</span>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </Button>
      
      {expanded && (
        <div className="p-3 text-xs font-mono">
          <div>Total Users: {data.totalUsers}</div>
          <div>Rating Officers: {data.ratingOfficers}</div>
          <div>Current User: {data.currentUser ? JSON.stringify(data.currentUser, null, 2) : 'None'}</div>
          <div className="mt-2 text-gray-500">
            Note: This debug panel is for development and testing purposes only.
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDebug;
