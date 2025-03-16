import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Medal, Award, Map, TrendingUp, Calendar, Users, Shield } from "lucide-react";

const About = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

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
      <section className="pt-32 pb-20 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            About Nigeria Chess Rating System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            A comprehensive platform dedicated to serving the chess community in Nigeria through standardized rating calculations, tournament management, and player progression tracking.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              The Nigeria Chess Rating System aims to establish a national standard for chess ratings in Nigeria, supporting the growth of organized chess across all Nigerian states.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              We provide accessible tournament management tools for organizers and create a reliable and fair rating system for all Nigerian chess players, supporting the development of chess at both grassroots and competitive levels throughout the country.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Key Objectives</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <TrendingUp className="text-gold-dark dark:text-gold-light w-6 h-6 flex-shrink-0 mt-1" />
                <span className="text-gray-700 dark:text-gray-300">Standardize chess rating calculation across Nigeria</span>
              </li>
              <li className="flex items-start gap-3">
                <Map className="text-gold-dark dark:text-gold-light w-6 h-6 flex-shrink-0 mt-1" />
                <span className="text-gray-700 dark:text-gray-300">Support chess growth across all 36 states and FCT</span>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="text-gold-dark dark:text-gold-light w-6 h-6 flex-shrink-0 mt-1" />
                <span className="text-gray-700 dark:text-gray-300">Provide efficient tournament management tools</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="text-gold-dark dark:text-gold-light w-6 h-6 flex-shrink-0 mt-1" />
                <span className="text-gray-700 dark:text-gray-300">Create a reliable and fair rating system</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto bg-white dark:bg-gray-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Key Features</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Our platform provides a comprehensive set of features designed to serve the Nigerian chess community effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <Users className="text-gold-dark dark:text-gold-light w-10 h-10 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">User Role Management</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Three distinct roles: Players, Tournament Organizers, and Rating Officers with role-based access control and registration approval workflow.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <Calendar className="text-gold-dark dark:text-gold-light w-10 h-10 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tournament Management</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Creation and organization of chess tournaments, Swiss pairing system, and comprehensive result tracking and standings calculation.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <TrendingUp className="text-gold-dark dark:text-gold-light w-10 h-10 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Player Rating System</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Modified Elo rating system with floor rating of 800 for new players and variable K-factors based on player experience and current rating.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <Map className="text-gold-dark dark:text-gold-light w-10 h-10 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Geographic Support</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Support for all Nigerian states and cities with location-based tournament filtering.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <ChessBoard className="text-gold-dark dark:text-gold-light w-10 h-10 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Performance Tracking</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Visual representation of rating progression, detailed tournament history, and real-time rating calculation.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <Award className="text-gold-dark dark:text-gold-light w-10 h-10 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Rating Transparency</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Open and transparent rating process with detailed calculation information and historical data accessible to all users.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Get In Touch</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center mb-8">
            Have questions about the Nigeria Chess Rating System? We're here to help!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-gold-dark dark:text-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
              <p className="text-gray-700 dark:text-gray-300">contact@nigeriaratings.org</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-gold-dark dark:text-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Phone</h3>
              <p className="text-gray-700 dark:text-gray-300">+234 800 123 4567</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-gold-dark dark:text-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Location</h3>
              <p className="text-gray-700 dark:text-gray-300">Lagos, Nigeria</p>
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

export default About;
