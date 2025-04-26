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

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Navbar />
        <Home />
        <Footer />
      </>
    ),
  },
  {
    path: "/tournaments",
    element: (
      <>
        <Navbar />
        <Tournaments />
        <Footer />
      </>
    ),
  },
  {
    path: "/tournaments/:tournamentId",
    element: (
      <>
        <Navbar />
        <TournamentDetails />
        <Footer />
      </>
    ),
  },
  {
    path: "/tournament-management/:tournamentId",
    element: (
      <>
        <Navbar />
        <TournamentManagement />
        <Footer />
      </>
    ),
  },
  {
    path: "/players",
    element: (
      <>
        <Navbar />
        <Players />
        <Footer />
      </>
    ),
  },
  {
    path: "/about",
    element: (
      <>
        <Navbar />
        <About />
        <Footer />
      </>
    ),
  },
  {
    path: "/login",
    element: (
      <>
        <Navbar />
        <Login />
        <Footer />
      </>
    ),
  },
  {
    path: "/register",
    element: (
      <>
        <Navbar />
        <Register />
        <Footer />
      </>
    ),
  },
  {
    path: "/organizer-dashboard",
    element: (
      <>
        <Navbar />
        <OrganizerDashboard />
        <Footer />
      </>
    ),
  },
  {
    path: "/officer-dashboard",
    element: (
      <>
        <Navbar />
        <OfficerDashboard />
        <Footer />
      </>
    ),
  },
  {
    path: "/pending-approval",
    element: (
      <>
        <Navbar />
        <PendingApproval />
        <Footer />
      </>
    ),
  },
  {
    path: "/system-testing",
    element: (
      <>
        <Navbar />
        <SystemTesting />
        <Footer />
      </>
    ),
  },
  {
    path: "/profile",
    element: <Profile />,
  },
]);

function App() {
  return (
    <div className="app-container">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
