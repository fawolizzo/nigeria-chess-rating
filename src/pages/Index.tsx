
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Calendar, UserCheck, Shield, Award, Trophy, Info, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import HomeReset from "@/components/HomeReset";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      {/* Hero Section with Enhanced Visual Hierarchy */}
      <div className="hero-pattern pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex justify-center mb-6">
              <Logo size="xl" showText={false} />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Nigerian Chess Rating System
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              A comprehensive platform for tournament organizers and players across Nigeria
              to manage chess tournaments and track ratings.
            </p>
            
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="btn-nigeria-primary" asChild>
                <Link to="/register">
                  <UserCheck className="mr-2 h-5 w-5" />
                  Get Started
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/about">
                  <Info className="mr-2 h-5 w-5" />
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content with Improved Card Design */}
      <div className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Join the Nigerian Chess Community
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Register as a tournament organizer or rating officer to contribute to the 
              growth of chess in Nigeria.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tournament Organizer Card with Enhanced Visual Appeal */}
            <Card className="feature-card border-green-100 dark:border-green-900 overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-14 h-14 flex items-center justify-center mb-2 feature-card-icon">
                  <Calendar className="h-8 w-8 text-green-700 dark:text-green-500" />
                </div>
                <CardTitle className="text-2xl">Tournament Organizers</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                  Register and manage chess tournaments across Nigeria
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2 text-left">
                  <li className="flex items-start">
                    <ArrowRight className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Create and manage tournaments in all 36 states</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Generate Swiss pairings for tournament rounds</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Record results and submit for rating calculations</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" asChild>
                  <Link to="/register?role=tournament_organizer" className="flex items-center justify-center">
                    Register as Organizer
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Rating Officer Card with Enhanced Visual Appeal */}
            <Card className="feature-card border-blue-100 dark:border-blue-900 overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-14 h-14 flex items-center justify-center mb-2 feature-card-icon">
                  <Shield className="h-8 w-8 text-blue-700 dark:text-blue-500" />
                </div>
                <CardTitle className="text-2xl">Rating Officers</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                  Manage the national rating system and approve tournaments
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2 text-left">
                  <li className="flex items-start">
                    <ArrowRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Approve tournament organizers and events</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Process tournament reports for rating calculations</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Manage player profiles and verify titles</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <Link to="/register?role=rating_officer" className="flex items-center justify-center">
                    Register as Rating Officer
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Browse Section with Improved Spacing and Design */}
      <div className="py-16 px-4 chessboard-pattern-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Explore the System
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Browse through players and tournaments to see what's happening in Nigerian chess
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="feature-card overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="mx-auto p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-2 feature-card-icon">
                  <Users className="h-8 w-8 text-purple-700 dark:text-purple-500" />
                </div>
                <CardTitle>Browse Players</CardTitle>
                <CardDescription>
                  View players, ratings, and performance history across Nigeria
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/players">
                    <Users className="mr-2 h-4 w-4" />
                    Browse Players
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="feature-card overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="mx-auto p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-2 feature-card-icon">
                  <Calendar className="h-8 w-8 text-amber-700 dark:text-amber-500" />
                </div>
                <CardTitle>Browse Tournaments</CardTitle>
                <CardDescription>
                  Find upcoming, ongoing, and completed chess tournaments
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/tournaments">
                    <Calendar className="mr-2 h-4 w-4" />
                    Browse Tournaments
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Reset Section with Better Isolation */}
      <div className="py-10 px-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto">
          <HomeReset />
        </div>
      </div>
      
      {/* Footer Section */}
      <footer className="footer py-8 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Logo size="sm" className="mr-2" />
                NCR Ratings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The official rating system for chess in Nigeria.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-nigeria-green dark:hover:text-nigeria-green-light transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/players" className="text-gray-600 dark:text-gray-400 hover:text-nigeria-green dark:hover:text-nigeria-green-light transition-colors">
                    Players Database
                  </Link>
                </li>
                <li>
                  <Link to="/tournaments" className="text-gray-600 dark:text-gray-400 hover:text-nigeria-green dark:hover:text-nigeria-green-light transition-colors">
                    Tournaments
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-nigeria-green dark:hover:text-nigeria-green-light transition-colors">
                    Rating Regulations
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-nigeria-green dark:hover:text-nigeria-green-light transition-colors">
                    Tournament Rules
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-nigeria-green dark:hover:text-nigeria-green-light transition-colors">
                    Rating Calculator
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-gray-600 dark:text-gray-400">
                  Email: nigeriachessrating@gmail.com
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Nigerian Chess Rating System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
