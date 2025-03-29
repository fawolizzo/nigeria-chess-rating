
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, UserCheck, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { forceSyncAllStorage, getFromStorage } from "@/utils/storageUtils";
import { logUserEvent, logMessage, LogLevel } from "@/utils/debugLogger";
import SyncStatusIndicator from "./SyncStatusIndicator";
import { STORAGE_KEY_USERS } from "@/types/userTypes";

// Schema for login form with conditional validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().optional(),
  code: z.string().optional(),
  role: z.enum(["tournament_organizer", "rating_officer"])
}).refine(data => {
  // If role is tournament_organizer, password is required
  if (data.role === "tournament_organizer") {
    return !!data.password;
  }
  // If role is rating_officer, code is required
  if (data.role === "rating_officer") {
    return !!data.code;
  }
  return false;
}, {
  message: "Password or code is required depending on your role",
  path: ["password"] // Default error path
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, isLoading: contextLoading, refreshUserData } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [syncBeforeLogin, setSyncBeforeLogin] = useState(false);
  const [syncTimeout, setSyncTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isLoginTimeout, setIsLoginTimeout] = useState(false);
  const [ratingOfficerExists, setRatingOfficerExists] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
      role: "tournament_organizer"
    }
  });
  
  // Watch for email changes to check if a rating officer exists with that email
  const watchedEmail = form.watch("email");
  const watchedRole = form.watch("role");
  
  // Check if rating officer exists when email or role changes
  useEffect(() => {
    if (watchedRole === "rating_officer" && watchedEmail) {
      const checkRatingOfficer = async () => {
        try {
          // Force sync to get latest users data
          await forceSyncAllStorage([STORAGE_KEY_USERS]);
          
          // Get users from storage
          const users = getFromStorage<any[]>(STORAGE_KEY_USERS, []);
          
          // Check if rating officer exists with this email
          const officerExists = users.some(user => 
            user.email.toLowerCase() === watchedEmail.toLowerCase() && 
            user.role === "rating_officer" &&
            user.status === "approved"
          );
          
          setRatingOfficerExists(officerExists);
          
          if (officerExists) {
            logMessage(LogLevel.INFO, 'LoginForm', `Rating officer found for email: ${watchedEmail}`);
          }
        } catch (error) {
          logMessage(LogLevel.ERROR, 'LoginForm', 'Error checking rating officer:', error);
        }
      };
      
      // Debounce the check to avoid too many checks
      const timer = setTimeout(() => {
        checkRatingOfficer();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [watchedEmail, watchedRole]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [syncTimeout]);
  
  // Optimize initial sync - only run once and use a more efficient approach
  useEffect(() => {
    let isMounted = true;
    let initialSyncTimeout: NodeJS.Timeout | null = null;
    
    const syncUserData = async () => {
      try {
        // Set a timeout for the initial sync
        initialSyncTimeout = setTimeout(() => {
          if (isMounted) {
            console.log("Initial sync timed out, continuing anyway");
            // Continue without showing an error
          }
        }, 3000); // Reduced timeout for better user experience
        
        // Only sync critical data needed for login
        await forceSyncAllStorage([STORAGE_KEY_USERS]);
        
        if (isMounted) {
          // Clear the timeout
          if (initialSyncTimeout) {
            clearTimeout(initialSyncTimeout);
            initialSyncTimeout = null;
          }
          
          await refreshUserData();
        }
      } catch (error) {
        console.error("Error during initial data sync:", error);
        
        if (isMounted) {
          // We failed, but we want to let the user continue anyway
          toast({
            title: "Data Sync Issue",
            description: "There was a problem syncing your data, but you can still continue.",
            variant: "warning",
          });
        }
      }
    };
    
    // Slight delay to allow component to mount fully
    setTimeout(() => {
      if (isMounted) {
        syncUserData();
      }
    }, 100);
    
    return () => {
      isMounted = false;
      
      if (initialSyncTimeout) {
        clearTimeout(initialSyncTimeout);
      }
    };
  }, [refreshUserData, toast]);
  
  const handleSyncComplete = () => {
    if (syncBeforeLogin) {
      setSyncBeforeLogin(false);
      toast({
        title: "Data Sync Complete",
        description: "Latest user data has been loaded from all devices. You can now login.",
      });
    }
  };
  
  const selectedRole = form.watch("role");
  
  // Memoize role change handler to prevent unnecessary re-renders
  const handleRoleChange = useMemo(() => (role: "tournament_organizer" | "rating_officer") => {
    form.setValue("role", role);
    
    // Clear the appropriate field when switching roles
    if (role === "tournament_organizer") {
      form.setValue("code", "");
    } else {
      form.setValue("password", "");
    }
    
    // Reset error state when changing roles
    setError("");
  }, [form]);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const onSubmit = async (data: LoginFormData) => {
    // Prevent multiple simultaneous submissions
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    setIsLoginTimeout(false);
    
    try {
      logUserEvent("Login attempt", undefined, { 
        email: data.email, 
        role: data.role,
        attempts: loginAttempts + 1
      });
      
      setLoginAttempts(prev => prev + 1);
      
      // Create a promise that will resolve after a timeout
      const syncTimeoutPromise = new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.log("Sync before login timed out, continuing with login");
          resolve();
        }, 2000);
        
        setSyncTimeout(timeoutId);
      });
      
      // Force sync before attempting login to ensure we have the latest user data
      try {
        logMessage(LogLevel.INFO, 'LoginForm', 'Syncing before login attempt');
        // Race between sync and timeout
        await Promise.race([
          forceSyncAllStorage([STORAGE_KEY_USERS]),
          syncTimeoutPromise
        ]);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'LoginForm', 'Error during sync before login:', error);
        // Continue with login even if sync fails
      } finally {
        // Clear the timeout if it's still active
        if (syncTimeout) {
          clearTimeout(syncTimeout);
          setSyncTimeout(null);
        }
      }
      
      // Check if the rating officer exists before attempting login
      if (data.role === "rating_officer") {
        // Get latest users from storage after sync
        const users = getFromStorage<any[]>(STORAGE_KEY_USERS, []);
        
        // Normalize email for comparison
        const normalizedEmail = data.email.toLowerCase().trim();
        
        // Check if rating officer exists with this email
        const officerExists = users.some(user => 
          user.email.toLowerCase() === normalizedEmail && 
          user.role === "rating_officer" &&
          user.status === "approved"
        );
        
        if (!officerExists) {
          logMessage(LogLevel.WARNING, 'LoginForm', `Login failed: No rating officer found with email ${data.email}`);
          setError(`No rating officer account found with email ${data.email}`);
          setIsLoading(false);
          return;
        }

        // Debug: Check if we can find the officer and their access code
        const officer = users.find(user => 
          user.email.toLowerCase() === normalizedEmail && 
          user.role === "rating_officer"
        );
        
        if (officer) {
          logMessage(LogLevel.INFO, 'LoginForm', `Found rating officer: ${officer.email}, status: ${officer.status}, has access code: ${!!officer.accessCode}`);
        }
      }
      
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
      };
      
      // Use password for tournament_organizer and code for rating_officer
      const authValue = normalizedData.role === "tournament_organizer" 
        ? normalizedData.password 
        : normalizedData.code;
      
      if (!authValue) {
        throw new Error(normalizedData.role === "tournament_organizer" 
          ? "Password is required" 
          : "Access code is required");
      }
      
      // Set a timeout for the login operation
      let loginTimeoutId: NodeJS.Timeout | null = null;
      
      // Create a promise that will resolve with false after a timeout
      const loginTimeoutPromise = new Promise<boolean>((resolve) => {
        loginTimeoutId = setTimeout(() => {
          setIsLoginTimeout(true);
          logMessage(LogLevel.WARNING, 'LoginForm', "Login operation timed out");
          resolve(false);
        }, 5000);
      });
      
      // Perform login
      const loginPromise = login(
        normalizedData.email, 
        authValue, 
        normalizedData.role
      );
      
      // Race between login and timeout
      const success = await Promise.race([
        loginPromise,
        loginTimeoutPromise
      ]);
      
      // Clear the login timeout
      if (loginTimeoutId) {
        clearTimeout(loginTimeoutId);
      }
      
      if (success) {
        logUserEvent("Login successful", undefined, { email: data.email, role: data.role });
        
        toast({
          title: "Login Successful",
          description: `Welcome back! You are now logged in as a ${data.role === 'tournament_organizer' ? 'Tournament Organizer' : 'Rating Officer'}.`,
        });
        
        // Navigate to the appropriate dashboard with a small delay to allow the toast to be seen
        setTimeout(() => {
          if (data.role === "tournament_organizer") {
            navigate("/organizer/dashboard");
          } else {
            navigate("/officer/dashboard");
          }
        }, 500);
      } else {
        logUserEvent("Login failed", undefined, { email: data.email, role: data.role });
        
        if (isLoginTimeout) {
          setError("Login timed out. Please try again. If the issue persists, try refreshing the page.");
          
          toast({
            title: "Login Timeout",
            description: "The login process took too long. Please try again or refresh the page.",
            variant: "destructive",
          });
        } else {
          setError(normalizedData.role === "tournament_organizer" 
            ? "Invalid credentials or your account is pending approval." 
            : "Invalid email or access code. Please check and try again.");
          
          toast({
            title: "Login Failed",
            description: normalizedData.role === "tournament_organizer" 
              ? "Invalid credentials or your account is pending approval." 
              : "Invalid email or access code. Please check and try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      logUserEvent("Login error", undefined, { error: error.message });
      
      setError(error.message || "An unexpected error occurred during login.");
      
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Cancel any pending sync
      setSyncBeforeLogin(false);
    } finally {
      setIsLoading(false);
      
      // Clear any remaining timeouts
      if (syncTimeout) {
        clearTimeout(syncTimeout);
        setSyncTimeout(null);
      }
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Access your Nigeria Chess Rating System account
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div
              className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
                selectedRole === "tournament_organizer"
                  ? "border-nigeria-green bg-nigeria-green/5"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => handleRoleChange("tournament_organizer")}
            >
              <UserCheck className={`h-6 w-6 mb-2 ${
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
              onClick={() => handleRoleChange("rating_officer")}
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
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {selectedRole === "tournament_organizer" ? (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your password" 
                        className="pl-10 pr-10" 
                        type={showPassword ? "text" : "password"}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 px-3 text-gray-400 hover:text-gray-500"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your access code" 
                        className="pl-10" 
                        type="text"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <Button
            type="submit"
            className="w-full bg-nigeria-green hover:bg-nigeria-green-dark dark:bg-nigeria-green-light dark:hover:bg-nigeria-green"
            disabled={isLoading || contextLoading}
          >
            {isLoading || contextLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLoginTimeout ? "Timeout..." : "Signing In..."}
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          
          <div className="mt-2">
            <SyncStatusIndicator onSyncComplete={handleSyncComplete} />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
