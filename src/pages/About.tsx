
import React from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Mail, Phone, Info } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/f6331ac0-4301-4fb1-a69c-e9d40250dc43.png" 
              alt="About NCR" 
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            About Nigerian Chess Rating System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Learn more about our platform and mission to develop chess in Nigeria.
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The Nigerian Chess Rating (NCR) System is a comprehensive web application designed to serve the chess community in Nigeria. It provides a centralized platform for tournament organizers across all 36 states and FCT to plan events, register players, calculate Elo ratings, and track player progression.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>User Role Management with three distinct roles: Players, Tournament Organizers, and Rating Officers</li>
                <li>Tournament Management with Swiss pairing system</li>
                <li>Modified Elo rating system with floor rating of 800 for new players</li>
                <li>Geographic support for all Nigerian states and cities</li>
                <li>Performance tracking with visual rating progression</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Rating System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Our modified Elo rating system uses variable K-factors based on player experience:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                <li>K=40 for new players (less than 30 games)</li>
                <li>K=32 for players rated below 2100</li>
                <li>K=24 for players rated 2100-2399</li>
                <li>K=16 for higher-rated players</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>Standardizes chess rating calculation across Nigeria</li>
                <li>Provides tournament organizers with tools to efficiently manage events</li>
                <li>Offers players visibility into their performance and progression</li>
                <li>Creates a centralized repository of Nigerian chess player profiles</li>
                <li>Promotes transparency in the rating process</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-nigeria-green" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Address</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Nigerian Chess Federation Headquarters<br />
                      National Stadium Complex, Surulere<br />
                      Lagos, Nigeria
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-nigeria-green" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                    <p className="text-gray-600 dark:text-gray-400">info@nigerianrating.com</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-nigeria-green" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Phone</p>
                    <p className="text-gray-600 dark:text-gray-400">+234 803 123 4567</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Project Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                This system aims to become the definitive platform for chess tournament management and player rating in Nigeria, supporting the development of chess at both grassroots and competitive levels throughout the country.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
