
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone } from 'lucide-react';

const Index = () => {
  // Only show development tools in non-production environments
  const isProduction = import.meta.env.PROD;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container px-4 py-8 mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight break-words">
            Welcome to the Nigerian Chess Rating System
          </h1>
          <p className="text-muted-foreground mt-2 px-4 max-w-3xl mx-auto">
            Manage players, tournaments, and ratings efficiently
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Link to="/players" className="transition-transform hover:scale-105">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <span className="bg-blue-100 p-2 rounded-md text-blue-500 mr-2 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 4.5C7 7.43 4 11.85 4 17v3h16v-3c0-5.15-3-9.57-8-12.5zM7.71 15h8.58l.29.29a.997.997 0 010 1.41L12 20.71l-4.59-4.59a.997.997 0 010-1.41L7.71 15z" />
                    </svg>
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
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <span className="bg-green-100 p-2 rounded-md text-green-500 mr-2 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 7h14a1 1 0 000-2H5a1 1 0 100 2zm0 10a1 1 0 100 2h14a1 1 0 100-2V9H5v8z" />
                    </svg>
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
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <span className="bg-yellow-100 p-2 rounded-md text-yellow-500 mr-2 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 11a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2zm11.75-6.18L15 10.5l-3-3-8.75 11.18A1 1 0 003 20h18a1 1 0 00.75-1.18z" />
                    </svg>
                  </span>
                  <span>About</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn more about the Nigerian Chess Federation and the rating system.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          {/* Only show cross-platform testing in development */}
          {!isProduction && (
            <Link to="/cross-platform-testing" className="transition-transform hover:scale-105">
              <Card className="h-full">
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
            &copy; {new Date().getFullYear()} Nigerian Chess Federation. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
