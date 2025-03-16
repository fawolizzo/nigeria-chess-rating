
import { useState, useEffect } from "react";
import { players, tournaments } from "@/lib/mockData";
import RankingTable from "@/components/RankingTable";
import PlayerCard from "@/components/PlayerCard";
import TournamentCard from "@/components/TournamentCard";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import { ArrowRight, Trophy, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Get top players and upcoming tournaments
  const topPlayers = players
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const upcomingTournaments = tournaments
    .filter(t => t.status === "upcoming")
    .slice(0, 2);

  const recentTournaments = tournaments
    .filter(t => t.status === "completed")
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, 2);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto animate-fade-in">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Nigeria Chess Rating System
            <span className="block text-gold-dark dark:text-gold-light">Official Ratings</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            The comprehensive rating platform for Nigerian chess players, tracking performance, tournaments, and achievements.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/players"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black dark:bg-gold-dark hover:bg-gray-900 dark:hover:bg-gold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-gold transition-colors duration-200"
            >
              Browse Players
            </Link>
            <Link
              to="/tournaments"
              className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition-colors duration-200"
            >
              View Tournaments
            </Link>
          </div>
        </div>
      </section>

      {/* Top Players Section */}
      <section className="py-16 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-gold-dark dark:text-gold-light" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Rated Players</h2>
          </div>
          <Link
            to="/players"
            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {topPlayers.map(player => (
            <div key={player.id} className="animate-fade-up">
              <PlayerCard player={player} />
            </div>
          ))}
        </div>
        
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <RankingTable players={players} itemsPerPage={10} />
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="py-16 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-gold-dark dark:text-gold-light" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tournaments</h2>
          </div>
          <Link
            to="/tournaments"
            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Tournaments</h3>
            <div className="grid grid-cols-1 gap-6">
              {upcomingTournaments.length > 0 ? (
                upcomingTournaments.map(tournament => (
                  <div key={tournament.id} className="animate-fade-up">
                    <TournamentCard tournament={tournament} />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 py-8 text-center">No upcoming tournaments</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Tournaments</h3>
            <div className="grid grid-cols-1 gap-6">
              {recentTournaments.map(tournament => (
                <div key={tournament.id} className="animate-fade-up" style={{ animationDelay: "100ms" }}>
                  <TournamentCard tournament={tournament} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 px-4 sm:px-6 md:px-8 lg:px-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-300">
                NCR Ratings
              </span>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The official Nigerian Chess Rating system.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                About
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Contact
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Privacy
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Terms
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Nigeria Chess Rating System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
