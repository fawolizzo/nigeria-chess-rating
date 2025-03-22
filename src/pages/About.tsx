
import React from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RatingSystemRules from "@/components/RatingSystemRules";

const About = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold">About Nigerian Chess Rating</h1>
          <p className="text-gray-500 mt-2">
            The official chess rating system for tournaments in Nigeria
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                The Nigerian Chess Rating (NCR) System aims to provide a comprehensive and reliable rating system for chess players across Nigeria. Our mission is to:
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">1</div>
                  <span>Establish a national standard for chess ratings in Nigeria</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">2</div>
                  <span>Support the growth of organized chess across all Nigerian states</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">3</div>
                  <span>Provide accessible tournament management tools for organizers</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">4</div>
                  <span>Create a reliable and fair rating system for all Nigerian chess players</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">5</div>
                  <span>Promote transparency in the rating process</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-nigeria-green flex items-center justify-center text-white font-bold mr-3">1</div>
                  <div>
                    <h3 className="font-semibold">Comprehensive Player Profiles</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Track player ratings, tournament history, and performance over time.
                    </p>
                  </div>
                </li>
                <li className="flex">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-nigeria-green flex items-center justify-center text-white font-bold mr-3">2</div>
                  <div>
                    <h3 className="font-semibold">Tournament Management</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Create and organize chess tournaments with tools for pairings, result recording, and standings.
                    </p>
                  </div>
                </li>
                <li className="flex">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-nigeria-green flex items-center justify-center text-white font-bold mr-3">3</div>
                  <div>
                    <h3 className="font-semibold">Multiple Rating Formats</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Track ratings for Classical, Rapid, and Blitz independently.
                    </p>
                  </div>
                </li>
                <li className="flex">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-nigeria-green flex items-center justify-center text-white font-bold mr-3">4</div>
                  <div>
                    <h3 className="font-semibold">Geographic Coverage</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Support for all 36 Nigerian states and the FCT, with location-based filtering.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-12">
          <RatingSystemRules variant="detailed" />
        </div>
        
        <div className="border-t pt-12 pb-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              For inquiries about the Nigerian Chess Rating system, tournament registration, or player profiles, please contact us:
            </p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600 dark:text-gray-400">contact@nigerianrating.org</p>
              </div>
              
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-gray-600 dark:text-gray-400">+234 123 4567 890</p>
              </div>
              
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Headquarters</h3>
                <p className="text-gray-600 dark:text-gray-400">Abuja, FCT, Nigeria</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
