import React from "react";
import { useUser } from "@/contexts/UserContext";
import { getFromStorageSync } from '@/utils/storageUtils';
import { User } from '@/types/userTypes';

const LoginDebug = () => {
  const { currentUser, users } = useUser();

  // Get all users from storage for debugging
  const allUsers = getFromStorageSync<User[]>('ncr_users', []);
  const currentUserFromStorage = getFromStorageSync<User>('ncr_current_user', null);

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        🔧 Login Debug Information
      </h3>
      
      <div className="space-y-3 text-sm">
        <div>
          <strong>Current User (Context):</strong>
          <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
            {currentUser ? JSON.stringify(currentUser, null, 2) : 'null'}
          </pre>
        </div>
        
        <div>
          <strong>Current User (Storage):</strong>
          <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
            {currentUserFromStorage ? JSON.stringify(currentUserFromStorage, null, 2) : 'null'}
          </pre>
        </div>
        
        <div>
          <strong>Users (Context):</strong>
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
          <strong>Users (Storage):</strong>
          <div className="text-xs">
            Count: {allUsers.length}
            {allUsers.length > 0 && (
              <ul className="list-disc list-inside mt-1">
                {allUsers.map((user, idx) => (
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
          {allUsers.filter(u => u.role === 'rating_officer').length === 0 && (
            <div className="text-red-500 ml-2">No rating officers found!</div>
          )}
          {allUsers.filter(u => u.role === 'rating_officer').map((officer, idx) => (
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
        
        <div>
          <strong>Tournament Organizers:</strong>
          {allUsers.filter(u => u.role === 'tournament_organizer').length === 0 && (
            <div className="text-red-500 ml-2">No tournament organizers found!</div>
          )}
          {allUsers.filter(u => u.role === 'tournament_organizer').map((organizer, idx) => (
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

export default LoginDebug;
