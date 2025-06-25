import React, { useEffect, useState } from 'react';
import { getFromStorageSync, saveToStorageSync } from '@/utils/storageUtils';

const TestStorage = () => {
  const [testData, setTestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Test saving data
      const testUser = {
        id: 'test-1',
        email: 'test@example.com',
        role: 'rating_officer',
        status: 'approved'
      };
      
      saveToStorageSync('test_users', [testUser]);
      console.log('✅ Test data saved successfully');
      
      // Test reading data
      const savedData = getFromStorageSync('test_users', []);
      setTestData(savedData);
      console.log('✅ Test data read successfully:', savedData);
      
    } catch (err) {
      console.error('❌ Storage test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Storage Test</h1>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-red-800 dark:text-red-200 font-semibold">Error:</h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}
        
        {testData && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-green-800 dark:text-green-200 font-semibold">Success!</h3>
            <p className="text-green-600 dark:text-green-300">Storage utilities are working correctly.</p>
            <pre className="text-xs mt-2 bg-white dark:bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-center">
          <a 
            href="/login" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestStorage; 