
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, InfoIcon } from 'lucide-react';
import { useProductionSync } from '@/hooks/useProductionSync';

const Index = () => {
  // Initialize the production sync hook to ensure data consistency across devices
  // This runs silently in the background without UI indicators for end users
  useProductionSync();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto pt-20 pb-10 px-4 sm:px-6">
        <div className="text-center mb-4 mt-4 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-snug">
            Welcome to the Nigerian Chess Rating System
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Manage players, tournaments, and ratings efficiently
          </p>
        </div>
        
        {/* Centered logo section with increased size and reduced spacing */}
        <div className="flex flex-col items-center justify-center mb-10 mt-8">
          <img 
            src="/lovable-uploads/cd12c0fd-5c90-4320-89be-a3d543be8bd9.png" 
            alt="Nigerian Chess Rating System Logo" 
            className="h-40 sm:h-48 md:h-56" 
          />
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-nigeria-green">
            NCR System
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
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
        </div>
        
        <div className="text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Nigeria Chess Rating. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
