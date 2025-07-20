import React from 'react';
import Navbar from '@/components/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
// import CrossPlatformTester from '@/components/CrossPlatformTester';

const CrossPlatformTesting: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cross-Platform Testing
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Test the rating system across different devices and platforms
            </p>
          </div>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Cross-platform testing is temporarily disabled while we fix some
              import issues. This page will be available again soon.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Cross-Platform Compatibility</CardTitle>
              <CardDescription>
                Test the rating system's compatibility across different devices
                and browsers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This tool helps ensure the Nigeria Chess Rating system works
                consistently across:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                <li>Desktop browsers (Chrome, Firefox, Safari, Edge)</li>
                <li>Mobile devices (iOS Safari, Android Chrome)</li>
                <li>Tablets and different screen sizes</li>
                <li>Different storage capabilities</li>
                <li>Network connectivity scenarios</li>
              </ul>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                      Testing Temporarily Disabled
                    </h4>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                      We're fixing some technical issues with the cross-platform
                      testing tools. Please check back later.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrossPlatformTesting;
