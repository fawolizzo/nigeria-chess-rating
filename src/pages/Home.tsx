
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-24 mt-16">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-gray-900 dark:text-white mb-6">
          Nigerian Chess Rating System
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400 mb-8">
          A centralized platform for tournament organizers to plan events, register players,
          calculate Elo ratings, and track player progression across Nigeria.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/tournaments">
            <Button className="bg-nigeria-green hover:bg-nigeria-green-dark text-white px-6">
              View Tournaments
            </Button>
          </Link>
          <Link to="/players">
            <Button variant="outline" className="border-nigeria-green text-nigeria-green hover:bg-nigeria-green/5">
              Browse Players
            </Button>
          </Link>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Tournament Management</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Create and organize chess tournaments across all Nigerian states
            </p>
          </div>
          <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Player Ratings</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Track Elo ratings with our modified rating system designed for Nigerian players
            </p>
          </div>
          <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Tournament Results</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Record results and automatically update player standings and ratings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
