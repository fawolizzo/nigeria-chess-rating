
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">Page Not Found</p>
        <p className="text-gray-500 dark:text-gray-500 mb-8">
          Sorry, we couldn't find the page you're looking for. The URL <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{location.pathname}</span> doesn't exist.
        </p>
        <Link to="/">
          <Button size="lg" className="gap-2">
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
