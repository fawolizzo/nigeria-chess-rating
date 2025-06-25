import React from "react";
import { getFromStorageSync } from '@/utils/storageUtils';
import { User } from '@/types/userTypes';

const RegistrationDebug = () => {
  // Get all users from storage for debugging
  const users = getFromStorageSync<User[]>('ncr_users', []);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
        🔧 Registration Debug Information
      </h3>
      
      <div className="space-y-3 text-sm">
        <div>
          <strong>Total Users in Storage:</strong>
          <div className="text-xs">
            Count: {users.length}
            {users.length > 0 && (
              <ul className="list-disc list-inside mt-1">
                {users.map((user, idx) => (
                  <li key={idx}>
                    {user.email} ({user.role}) - {user.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div>
          <strong>Rating Officers:</strong>
          {users.filter(u => u.role === 'rating_officer').length === 0 && (
            <div className="text-red-500 ml-2">No rating officers found!</div>
          )}
          {users.filter(u => u.role === 'rating_officer').map((officer, idx) => (
            <div key={idx} className="ml-2 mb-1 p-1 border-b border-gray-200 dark:border-gray-700">
              <div><span className="text-blue-500">Email:</span> {officer.email}</div>
              <div><span className="text-blue-500">Status:</span> {officer.status}</div>
              <div><span className="text-blue-500">Access Code:</span> {officer.accessCode || "RNCR25"}</div>
            </div>
          ))}
        </div>
        
        <div>
          <strong>Tournament Organizers:</strong>
          {users.filter(u => u.role === 'tournament_organizer').length === 0 && (
            <div className="text-red-500 ml-2">No tournament organizers found!</div>
          )}
          {users.filter(u => u.role === 'tournament_organizer').map((organizer, idx) => (
            <div key={idx} className="ml-2 mb-1 p-1 border-b border-gray-200 dark:border-gray-700">
              <div><span className="text-blue-500">Email:</span> {organizer.email}</div>
              <div><span className="text-blue-500">Status:</span> {organizer.status}</div>
              <div><span className="text-blue-500">Has Password:</span> {organizer.password ? "Yes" : "No"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegistrationDebug;
