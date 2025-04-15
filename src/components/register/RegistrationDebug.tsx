
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getFromStorage } from '@/utils/storageUtils';

const RegistrationDebug = () => {
  // Never show in production environment under any circumstances
  const isProduction = import.meta.env.PROD;
  if (isProduction) {
    return null;
  }
  
  const [expanded, setExpanded] = useState(false);

  const getUserData = () => {
    const users = getFromStorage('ncr_users', []);
    
    return {
      totalUsers: Array.isArray(users) ? users.length : 0,
      ratingOfficers: Array.isArray(users) ? users.filter((u: any) => u.role === 'rating_officer').map((u: any) => ({
        email: u.email,
        status: u.status,
        hasPassword: !!u.password,
        hasAccessCode: !!u.accessCode
      })) : [],
      organizers: Array.isArray(users) ? users.filter((u: any) => u.role === 'tournament_organizer').map((u: any) => ({
        email: u.email,
        status: u.status
      })) : []
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
        <span>Registration Debug Information</span>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </Button>
      
      {expanded && (
        <div className="p-3 text-xs font-mono">
          <div>Total Users: {data.totalUsers}</div>
          <div>Rating Officers: {data.ratingOfficers.length}</div>
          <div>
            {data.ratingOfficers.length > 0 && (
              <div className="mt-1 ml-2">
                {data.ratingOfficers.map((officer: any, index: number) => (
                  <div key={index} className="mb-1">
                    {officer.email} (Status: {officer.status}, Password: {officer.hasPassword ? "Yes" : "No"}, Access Code: {officer.hasAccessCode ? "Yes" : "No"})
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>Tournament Organizers: {data.organizers.length}</div>
          <div>
            {data.organizers.length > 0 && (
              <div className="mt-1 ml-2">
                {data.organizers.map((organizer: any, index: number) => (
                  <div key={index} className="mb-1">
                    {organizer.email} (Status: {organizer.status})
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 text-gray-500">
            Note: This debug panel is for development and testing purposes only.
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationDebug;
