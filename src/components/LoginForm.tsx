
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogIn, 
  Mail, 
  Lock, 
  Calendar, 
  Shield, 
  Check, 
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { syncStorage, ensureDeviceId } from "@/utils/storageUtils";
import { logAuthEvent, checkStorageHealth } from "@/utils/debugLogger";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["tournament_organizer", "rating_officer"]),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, currentUser, refreshUserData, forceSync, users } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const isMobile = useIsMobile();
  
  // Initialize user context
  useEffect(() => {
    const initializeLogin = async () => {
      try {
        // Log initialization
        logAuthEvent("Initializing login form");
        
        // Ensure device has ID
        ensureDeviceId();
        
        // Check storage health
        const healthCheck = checkStorageHealth();
        if (!healthCheck.healthy) {
          logAuthEvent("Storage health check failed", undefined, healthCheck.issues);
          toast({
            title: "Storage Issues Detected",
            description: "Some data storage issues were detected. Try clearing your browser cache if login fails.",
            variant: "warning",
            duration: 6000
          });
        }
        
        // Silently refresh user data without showing UI indicators
        await syncStorage(['ncr_users', 'ncr_current_user']);
        await refreshUserData();
        await forceSync();
        
        logAuthEvent("Login form initialized successfully");
      } catch (error) {
        console.error("[LoginForm] Error initializing login form:", error);
        logAuthEvent("Login form initialization error", undefined, error);
      }
    };
    
    initializeLogin();
  }, [refreshUserData, forceSync, toast]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      logAuthEvent(`User already logged in: ${currentUser.email}`);
      
      if (currentUser.role === "tournament_organizer") {
        navigate("/organizer/dashboard", { replace: true });
      } else {
        navigate("/officer/dashboard", { replace: true });
      }
    }
  }, [currentUser, navigate]);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "tournament_organizer",
    }
  });
  
  const selectedRole = form.watch("role");
  const emailValue = form.watch("email");
  
  // Check if the entered email exists in the system
  useEffect(() => {
    if (emailValue && emailValue.length > 5) {
      const normalizedEmail = emailValue.toLowerCase().trim();
      const matchingUser = users.find(u => 
        u.email && u.email.toLowerCase() === normalizedEmail &&
        u.role === selectedRole
      );
      
      if (matchingUser) {
        setUserData({
          status: matchingUser.status,
          role: matchingUser.role,
          fullName: matchingUser.fullName
        });
      } else {
        setUserData(null);
      }
    } else {
      setUserData(null);
    }
  }, [emailValue, selectedRole, users]);
  
  const handleForceSync = async () => {
    setIsSyncing(true);
    setErrorMessage("");
    
    try {
      logAuthEvent("Forcing data sync from login form");
      
      // Perform a deep sync
      await syncStorage(['ncr_users', 'ncr_current_user']);
      const success = await forceSync();
      
      if (success) {
        toast({
          title: "Data Refreshed",
          description: "User data has been refreshed successfully.",
        });
        logAuthEvent("Data sync successful");
      } else {
        toast({
          title: "Sync Warning",
          description: "Data refresh may be incomplete. Try again if login fails.",
          variant: "warning"
        });
        logAuthEvent("Data sync incomplete");
      }
    } catch (error) {
      console.error("[LoginForm] Force sync error:", error);
      logAuthEvent("Force sync error", undefined, error);
      
      toast({
        title: "Sync Error",
        description: "Failed to refresh data. Try reloading the page.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      // Log login attempt
      logAuthEvent(`Login attempt - Email: ${data.email}, Role: ${data.role}`);
      
      // Normalize email
      const normalizedEmail = data.email.toLowerCase().trim();
      
      // Check user status before attempting login
      const userExists = users.find(u => 
        u.email && u.email.toLowerCase() === normalizedEmail && 
        u.role === data.role
      );
      
      // If user exists but is pending approval
      if (userExists && userExists.status === 'pending' && data.role === 'tournament_organizer') {
        logAuthEvent("Login attempt for pending account", userExists.id);
        setErrorMessage("Your account is pending approval by a rating officer. Please try again later.");
        setIsSubmitting(false);
        return;
      }
      
      // If user exists but is rejected
      if (userExists && userExists.status === 'rejected') {
        logAuthEvent("Login attempt for rejected account", userExists.id);
        setErrorMessage("Your registration has been rejected. Please contact support for assistance.");
        setIsSubmitting(false);
        return;
      }
      
      // Attempt login
      const success = await login(
        normalizedEmail, 
        data.password, 
        data.role as 'tournament_organizer' | 'rating_officer'
      );
      
      if (success) {
        setSuccessMessage("Login successful!");
        logAuthEvent("Login successful", undefined, { email: normalizedEmail, role: data.role });
        
        // Slight delay to allow state to update
        setTimeout(() => {
          if (data.role === "tournament_organizer") {
            navigate("/organizer/dashboard", { replace: true });
          } else {
            navigate("/officer/dashboard", { replace: true });
          }
        }, 300);
      } else {
        logAuthEvent("Login failed", undefined, { email: normalizedEmail, role: data.role });
        
        if (!userExists) {
          setErrorMessage(`No ${data.role === 'tournament_organizer' ? 'Tournament Organizer' : 'Rating Officer'} account found with this email.`);
        } else {
          setErrorMessage("Invalid password. Please check your credentials and try again.");
        }
      }
    } catch (error: any) {
      console.error("[LoginForm] Login error:", error);
      logAuthEvent("Login error", undefined, error);
      
      setErrorMessage(error.message || "Login failed. Please try again.");
      
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Login</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to your Nigeria Chess Rating System account
        </p>
      </div>
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start">
          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="ml-3 text-sm text-green-700 dark:text-green-300">{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
            <button 
              onClick={handleForceSync} 
              className="mt-2 text-xs text-red-600 dark:text-red-300 flex items-center hover:underline"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Refresh data and try again
            </button>
          </div>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className={isMobile ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-4"}>
            <div
              className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
                selectedRole === "tournament_organizer"
                  ? "border-nigeria-green bg-nigeria-green/5"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => form.setValue("role", "tournament_organizer")}
            >
              <Calendar className={`h-6 w-6 mb-2 ${
                selectedRole === "tournament_organizer"
                  ? "text-nigeria-green dark:text-nigeria-green-light"
                  : "text-gray-500 dark:text-gray-400"
              }`} />
              <h3 className={`text-sm font-medium ${
                selectedRole === "tournament_organizer"
                  ? "text-nigeria-green-dark dark:text-nigeria-green-light"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                Tournament Organizer
              </h3>
            </div>
            
            <div
              className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
                selectedRole === "rating_officer"
                  ? "border-nigeria-green bg-nigeria-green/5"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => form.setValue("role", "rating_officer")}
            >
              <Shield className={`h-6 w-6 mb-2 ${
                selectedRole === "rating_officer"
                  ? "text-nigeria-green dark:text-nigeria-green-light"
                  : "text-gray-500 dark:text-gray-400"
              }`} />
              <h3 className={`text-sm font-medium ${
                selectedRole === "rating_officer"
                  ? "text-nigeria-green-dark dark:text-nigeria-green-light"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                Rating Officer
              </h3>
            </div>
          </div>
          
          <input type="hidden" {...form.register("role")} />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Enter your email address" 
                      className="pl-10" 
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </div>
                </FormControl>
                {userData && (
                  <div className="mt-1">
                    {userData.status === 'pending' && userData.role === 'tournament_organizer' ? (
                      <p className="text-xs text-orange-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        This account is pending approval
                      </p>
                    ) : userData.status === 'approved' ? (
                      <p className="text-xs text-green-500 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        {userData.fullName}'s account is active
                      </p>
                    ) : userData.status === 'rejected' ? (
                      <p className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        This account has been rejected
                      </p>
                    ) : null}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {selectedRole === "rating_officer" ? "Access Code" : "Password"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder={selectedRole === "rating_officer" ? "Enter Rating Officer access code" : "Enter your password"} 
                      className="pl-10" 
                      type="password"
                      autoComplete={selectedRole === "rating_officer" ? "off" : "current-password"}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            className="w-full bg-nigeria-green hover:bg-nigeria-green-dark text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleForceSync}
              className="text-xs text-gray-500 flex items-center mx-auto hover:underline"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Refresh user data
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
