
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Players from './pages/Players';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import OrganizerDashboard from './pages/OrganizerDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import PendingApproval from './pages/PendingApproval';
import TournamentDetails from './pages/TournamentDetails';
import TournamentManagement from './pages/TournamentManagement';
import SystemTesting from './pages/SystemTesting';
import Profile from './pages/Profile';
import ErrorBoundary from './components/ErrorBoundary';

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Navbar />
        <Home />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/tournaments",
    element: (
      <ErrorBoundary>
        <Navbar />
        <Tournaments />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/tournaments/:tournamentId",
    element: (
      <ErrorBoundary>
        <Navbar />
        <TournamentDetails />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/tournament-management/:tournamentId",
    element: (
      <ErrorBoundary>
        <Navbar />
        <TournamentManagement />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/players",
    element: (
      <ErrorBoundary>
        <Navbar />
        <Players />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/about",
    element: (
      <ErrorBoundary>
        <Navbar />
        <About />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/login",
    element: (
      <ErrorBoundary>
        <Navbar />
        <Login />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/register",
    element: (
      <ErrorBoundary>
        <Navbar />
        <Register />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/organizer-dashboard",
    element: (
      <ErrorBoundary>
        <OrganizerDashboard />
      </ErrorBoundary>
    ),
  },
  {
    path: "/officer-dashboard",
    element: (
      <ErrorBoundary>
        <OfficerDashboard />
      </ErrorBoundary>
    ),
  },
  {
    path: "/pending-approval",
    element: (
      <ErrorBoundary>
        <Navbar />
        <PendingApproval />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/system-testing",
    element: (
      <ErrorBoundary>
        <Navbar />
        <SystemTesting />
        <Footer />
      </ErrorBoundary>
    ),
  },
  {
    path: "/profile",
    element: (
      <ErrorBoundary>
        <Profile />
      </ErrorBoundary>
    ),
  },
]);

function App() {
  return (
    <div className="app-container">
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </div>
  );
}

export default App;
