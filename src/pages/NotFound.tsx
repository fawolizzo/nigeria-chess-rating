
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  useEffect(() => {
    logMessage(
      LogLevel.ERROR,
      'NotFound',
      `404 Error: User attempted to access non-existent route: ${location.pathname}`,
      { userId: currentUser?.id, userRole: currentUser?.role }
    );
  }, [location.pathname, currentUser]);

  // Function to navigate back
  const goBack = () => {
    navigate(-1);
  };

  // Function to determine where to redirect the user
  const getHomeLink = () => {
    if (!currentUser) return "/";
    
    switch (currentUser.role) {
      case "rating_officer":
        return "/officer-dashboard";
      case "tournament_organizer":
        return currentUser.status === "approved" 
          ? "/organizer-dashboard" 
          : "/pending-approval";
      default:
        return "/";
    }
  };

  // Generate a helpful message based on the path and user role
  const getErrorMessage = () => {
    const path = location.pathname;
    
    if (path.includes('officer') && currentUser?.role !== 'rating_officer') {
      return "This area is only accessible to Rating Officers.";
    }
    
    if (path.includes('organizer') && currentUser?.role !== 'tournament_organizer') {
      return "This area is only accessible to Tournament Organizers.";
    }
    
    if (path.includes('tournament-management')) {
      return "The requested tournament might not exist or you may not have permission to access it.";
    }
    
    return "Sorry, we couldn't find the page you're looking for.";
  };

  const homeLink = getHomeLink();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">Page Not Found</p>
        <p className="text-gray-500 dark:text-gray-500 mb-2">
          {getErrorMessage()}
        </p>
        <p className="text-gray-500 dark:text-gray-500 mb-8 text-sm">
          The URL <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{location.pathname}</span> doesn't exist.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={goBack} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          
          <Link to={homeLink}>
            <Button size="lg" className="gap-2 w-full">
              <Home className="h-4 w-4" />
              {currentUser ? (currentUser.role === "rating_officer" 
                ? "Return to Officer Dashboard" 
                : "Return to Dashboard") 
              : "Return to Home"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
