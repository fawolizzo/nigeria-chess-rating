
import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, UserPlus, LogIn, LogOut, User, Shield, Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  notificationCount?: number;
}

const Navbar = ({ notificationCount = 0 }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, logout } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      variant: "default",
    });
  };

  const getDashboardLink = () => {
    if (!currentUser) return null;
    
    if (currentUser.role === 'tournament_organizer') {
      return (
        <Button variant="outline" size="sm" asChild>
          <Link to="/organizer/dashboard" className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </Button>
      );
    } else if (currentUser.role === 'rating_officer') {
      return (
        <Button variant="outline" size="sm" asChild>
          <Link to="/officer/dashboard" className="flex items-center relative">
            <Shield className="mr-1 h-4 w-4" />
            <span>Dashboard</span>
            {notificationCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {notificationCount}
              </Badge>
            )}
          </Link>
        </Button>
      );
    }
    
    return null;
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-300">
                NCR Ratings
              </span>
            </NavLink>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `transition-colors duration-200 ${
                  isActive
                    ? "text-black dark:text-white font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/players"
              className={({ isActive }) =>
                `transition-colors duration-200 ${
                  isActive
                    ? "text-black dark:text-white font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`
              }
            >
              Players
            </NavLink>
            <NavLink
              to="/tournaments"
              className={({ isActive }) =>
                `transition-colors duration-200 ${
                  isActive
                    ? "text-black dark:text-white font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`
              }
            >
              Tournaments
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `transition-colors duration-200 ${
                  isActive
                    ? "text-black dark:text-white font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`
              }
            >
              About
            </NavLink>
            
            <div className="flex items-center gap-2">
              {currentUser ? (
                <>
                  {getDashboardLink()}
                  <Button variant="default" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-1 h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/login" className="flex items-center">
                      <LogIn className="mr-1 h-4 w-4" />
                      <span>Sign In</span>
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register" className="flex items-center">
                      <UserPlus className="mr-1 h-4 w-4" />
                      <span>Register</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center md:hidden">
            {currentUser && currentUser.role === 'rating_officer' && notificationCount > 0 && (
              <div className="mr-2 relative">
                <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                  {notificationCount}
                </Badge>
              </div>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        } overflow-hidden`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/90 dark:bg-black/90 backdrop-blur-md">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive
                  ? "text-black dark:text-white font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
              }`
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/players"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive
                  ? "text-black dark:text-white font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
              }`
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Players
          </NavLink>
          <NavLink
            to="/tournaments"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive
                  ? "text-black dark:text-white font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
              }`
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Tournaments
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive
                  ? "text-black dark:text-white font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
              }`
            }
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </NavLink>
          
          <div className="pt-4 pb-2 border-t border-gray-200 dark:border-gray-700">
            {currentUser ? (
              <>
                {currentUser.role === 'tournament_organizer' && (
                  <Link
                    to="/organizer/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Dashboard
                    </div>
                  </Link>
                )}
                
                {currentUser.role === 'rating_officer' && (
                  <Link
                    to="/officer/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center relative">
                      <Shield className="mr-2 h-4 w-4" />
                      Dashboard
                      {notificationCount > 0 && (
                        <Badge className="ml-2 bg-red-500">
                          {notificationCount}
                        </Badge>
                      )}
                    </div>
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                >
                  <div className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </div>
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
