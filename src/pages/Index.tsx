
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Calendar, UserCheck, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import HomeReset from "@/components/HomeReset";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Nigerian Chess Rating System
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            A comprehensive platform for tournament organizers and players across Nigeria
            to manage chess tournaments and track ratings.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
          <Link 
            to="/register?role=tournament_organizer" 
            className="group block p-6 bg-white dark:bg-gray-900 border border-green-100 dark:border-green-900 rounded-lg hover:border-green-500 dark:hover:border-green-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-green-700 dark:text-green-500" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Tournament Organizers
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Register and manage chess tournaments across Nigeria
                </p>
              </div>
            </div>
            <div className="pl-16 flex items-center text-green-700 dark:text-green-500 group-hover:underline text-sm font-medium">
              Register as Organizer <ChevronRight className="ml-1 h-4 w-4" />
            </div>
          </Link>
          
          <Link 
            to="/register?role=rating_officer" 
            className="group block p-6 bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900 rounded-lg hover:border-blue-500 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-blue-700 dark:text-blue-500" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Rating Officers
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage the national rating system and approve tournaments
                </p>
              </div>
            </div>
            <div className="pl-16 flex items-center text-blue-700 dark:text-blue-500 group-hover:underline text-sm font-medium">
              Register as Rating Officer <ChevronRight className="ml-1 h-4 w-4" />
            </div>
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center mt-12">
          <Link to="/players">
            <Button className="mb-4 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
              <Users className="mr-2 h-4 w-4" />
              Browse Players
            </Button>
          </Link>
          
          <Link to="/tournaments">
            <Button className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
              <Calendar className="mr-2 h-4 w-4" />
              Browse Tournaments
            </Button>
          </Link>
        </div>
        
        <HomeReset />
      </div>
    </div>
  );
};

export default Index;
