
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
                NCF Ratings
              </span>
            </NavLink>
          </div>

          {/* Desktop menu */}
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
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
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

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "max-h-64 opacity-100"
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
