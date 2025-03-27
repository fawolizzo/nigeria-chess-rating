
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/LoginForm";
import { PlayerStorageInitializer } from "@/components";

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <PlayerStorageInitializer />
      
      <div className="max-w-7xl mx-auto pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
          <LoginForm />
          
          <div className="px-6 pb-6 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-nigeria-green dark:text-nigeria-green-light font-medium hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
