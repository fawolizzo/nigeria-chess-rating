
import React from "react";
import Navbar from "@/components/Navbar";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            About Nigerian Chess Rating System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Learn more about our platform and mission to develop chess in Nigeria.
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The Nigerian Chess Rating (NCR) System is a comprehensive web application designed to serve the chess community in Nigeria. It provides a centralized platform for tournament organizers across all 36 states and FCT to plan events, register players, calculate Elo ratings, and track player progression.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Key Features
            </h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 mb-6">
              <li>User Role Management with three distinct roles: Players, Tournament Organizers, and Rating Officers</li>
              <li>Tournament Management with Swiss pairing system</li>
              <li>Modified Elo rating system with floor rating of 800 for new players</li>
              <li>Geographic support for all Nigerian states and cities</li>
              <li>Performance tracking with visual rating progression</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Rating System
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our modified Elo rating system uses variable K-factors based on player experience:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
              <li>K=40 for new players (less than 30 games)</li>
              <li>K=32 for players rated below 2100</li>
              <li>K=24 for players rated 2100-2399</li>
              <li>K=16 for higher-rated players</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
