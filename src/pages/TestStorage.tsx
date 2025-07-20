import React, { useEffect, useState } from 'react';
import { getFromStorageSync, saveToStorageSync } from '@/utils/storageUtils';
import { initializeTestData } from '@/utils/initializeTestData';

const TestStorage = () => {
  const [testData, setTestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [storageData, setStorageData] = useState<any>(null);

  useEffect(() => {
    try {
      // Test saving data
      const testUser = {
        id: 'test-1',
        email: 'test@example.com',
        role: 'rating_officer',
        status: 'approved',
      };

      saveToStorageSync('test_users', [testUser]);
      console.log('✅ Test data saved successfully');

      // Test reading data
      const savedData = getFromStorageSync('test_users', []);
      setTestData(savedData);
      console.log('✅ Test data read successfully:', savedData);

      // Check if test data is initialized
      const users = getFromStorageSync('ncr_users', []);
      const players = getFromStorageSync('ncr_players', []);
      const tournaments = getFromStorageSync('ncr_tournaments', []);

      setStorageData({
        users: users.length,
        players: players.length,
        tournaments: tournaments.length,
        userDetails: users.slice(0, 2), // Show first 2 users
        playerDetails: players.slice(0, 2), // Show first 2 players
        tournamentDetails: tournaments.slice(0, 2), // Show first 2 tournaments
      });

      console.log('📊 Storage data check:', {
        users: users.length,
        players: players.length,
        tournaments: tournaments.length,
      });
    } catch (err) {
      console.error('❌ Storage test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const handleInitializeTestData = () => {
    try {
      console.log('🚀 Manually initializing test data...');
      initializeTestData();

      // Reload page to see updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('❌ Failed to initialize test data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Storage Test & Debug</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-red-800 dark:text-red-200 font-semibold">
              Error:
            </h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        {testData && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-green-800 dark:text-green-200 font-semibold">
              ✅ Storage Test Success!
            </h3>
            <p className="text-green-600 dark:text-green-300">
              Storage utilities are working correctly.
            </p>
            <pre className="text-xs mt-2 bg-white dark:bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
        )}

        {storageData && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-blue-800 dark:text-blue-200 font-semibold">
              📊 Current Storage Data:
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {storageData.users}
                </div>
                <div className="text-sm text-blue-500">Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {storageData.players}
                </div>
                <div className="text-sm text-blue-500">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {storageData.tournaments}
                </div>
                <div className="text-sm text-blue-500">Tournaments</div>
              </div>
            </div>

            {storageData.users === 0 && (
              <div className="text-center">
                <p className="text-yellow-600 dark:text-yellow-400 mb-2">
                  No test data found!
                </p>
                <button
                  onClick={handleInitializeTestData}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Initialize Test Data
                </button>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">
                View Details
              </summary>
              <pre className="text-xs mt-2 bg-white dark:bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(storageData, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="text-center space-y-4">
          <a
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline block"
          >
            Go to Login
          </a>
          <a
            href="/officer-dashboard"
            className="text-green-600 dark:text-green-400 hover:underline block"
          >
            Go to RO Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestStorage;
