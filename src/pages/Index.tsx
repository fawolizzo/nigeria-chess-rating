
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Users, Calendar, InfoIcon } from 'lucide-react';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import { useProductionSync } from '@/hooks/useProductionSync';

const Index = () => {
  // Only show development tools in non-production environments
  const isProduction = import.meta.env.PROD;
  
  // Initialize the production sync hook to ensure data consistency across devices
  useProductionSync();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-7xl px-4 py-8 mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome to the Nigerian Chess Rating System
          </h1>
          <p className="text-muted-foreground mt-2 px-4 max-w-3xl mx-auto">
            Manage players, tournaments, and ratings efficiently
          </p>
          
          {/* Add sync status indicator to show sync status */}
          <div className="mt-2">
            <SyncStatusIndicator forceShow={true} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Link to="/players" className="transition-transform hover:scale-105">
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <span className="bg-blue-100 p-2 rounded-md text-blue-500 mr-2 flex-shrink-0">
                    <Users className="h-5 w-5" />
                  </span>
                  <span>Players</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage chess players in the Nigerian rating system.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/tournaments" className="transition-transform hover:scale-105">
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <span className="bg-green-100 p-2 rounded-md text-green-500 mr-2 flex-shrink-0">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <span>Tournaments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Explore ongoing and past chess tournaments.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/about" className="transition-transform hover:scale-105">
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <span className="bg-yellow-100 p-2 rounded-md text-yellow-500 mr-2 flex-shrink-0">
                    <InfoIcon className="h-5 w-5" />
                  </span>
                  <span>About</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn more about the Nigerian Chess Rating system.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          {/* Only show cross-platform testing in development */}
          {!isProduction && (
            <Link to="/cross-platform-testing" className="transition-transform hover:scale-105">
              <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <span className="bg-blue-100 p-2 rounded-md text-blue-500 mr-2 flex-shrink-0">
                      <Smartphone className="h-5 w-5" />
                    </span>
                    <span>Cross-Platform Testing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Test the rating system across different devices to ensure data consistency.
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Nigeria Chess Rating. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
