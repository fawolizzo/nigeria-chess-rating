import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RegisterForm from '@/components/RegisterForm';
import { logMessage, LogLevel } from '@/utils/debugLogger';

const Register = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeRegistration = async () => {
      try {
        setIsInitializing(true);
        logMessage(LogLevel.INFO, 'Register', 'Initializing registration page');

        // Simulate initialization delay
        setTimeout(() => {
          setIsInitializing(false);
        }, 300);
      } catch (error) {
        console.error('Error initializing register page:', error);
        logMessage(
          LogLevel.ERROR,
          'Register',
          'Register page initialization error',
          error
        );
        setIsInitializing(false);
      }
    };

    initializeRegistration();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {isInitializing ? (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-nigeria-green animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Initializing registration form...
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
            <RegisterForm />

            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-nigeria-green dark:text-nigeria-green-light hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
