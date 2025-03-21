
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const MinimalTest = () => {
  console.log("MinimalTest component rendering");
  
  return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-gray-50 rounded-lg shadow-md p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">Nigerian Chess Rating System</h1>
        
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 font-medium mb-2">✓ React is rendering correctly</p>
          <p className="text-green-700">If you can see this page, the React application is working properly.</p>
        </div>
        
        <p className="mb-6 text-gray-700">
          This is a test page to verify that rendering is working. You can now navigate to other pages within the application.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button asChild className="w-full h-12">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full h-12">
            <Link to="/register">
              Register Account
            </Link>
          </Button>
        </div>
        
        <div className="space-y-2 text-sm">
          <h2 className="font-semibold text-gray-900">Quick Links:</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
            <Link to="/players" className="text-blue-600 hover:underline">Players List</Link>
            <Link to="/tournaments" className="text-blue-600 hover:underline">Tournaments</Link>
            <Link to="/about" className="text-blue-600 hover:underline">About</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalTest;
