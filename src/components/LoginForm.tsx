
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
import { toast } from "@/components/ui/use-toast";
import { forceSyncAllStorage } from "@/utils/storageUtils";
import { logUserEvent } from "@/utils/debugLogger";
import SyncStatusIndicator from "./SyncStatusIndicator";

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
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
      role: "tournament_organizer"
    }
  });
  
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
    const syncUserData = async () => {
      try {
        // Only sync critical data needed for login with a 5 second timeout
        const syncPromise = forceSyncAllStorage(['ncr_users', 'ncr_current_user']);
        
        // Create a timeout that resolves after 5 seconds
        const timeoutPromise = new Promise<boolean>(resolve => {
          const timeoutId = setTimeout(() => {
            console.log("Initial sync timed out, continuing anyway");
            resolve(true);
          }, 5000);
          
          setSyncTimeout(timeoutId);
        });
        
        // Use Promise.race to either wait for sync or timeout
        await Promise.race([syncPromise, timeoutPromise]);
        
        await refreshUserData();
        
      } catch (error) {
        console.error("Error during initial data sync:", error);
      }
    };
    
    syncUserData();
  }, [refreshUserData]);
  
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
    setIsLoading(true);
    setError("");
    
    try {
      logUserEvent("Login attempt", undefined, { 
        email: data.email, 
        role: data.role,
        attempts: loginAttempts + 1
      });
      
      setLoginAttempts(prev => prev + 1);
      
      // Force sync with timeout to prevent hanging
      const syncPromise = forceSyncAllStorage(['ncr_users', 'ncr_current_user']);
      
      // Set a timeout of 5 seconds for the sync operation
      const timeoutPromise = new Promise<void>(resolve => {
        const timeoutId = setTimeout(() => {
          console.log("Sync before login timed out, continuing with login");
          resolve();
        }, 5000);
        
        setSyncTimeout(timeoutId);
      });
      
      // Use Promise.race to either wait for sync or timeout
      await Promise.race([syncPromise, timeoutPromise]);
      
      // Clear the timeout if sync completed successfully
      if (syncTimeout) {
        clearTimeout(syncTimeout);
        setSyncTimeout(null);
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
      const loginTimeoutPromise = new Promise<void>((_, reject) => {
        loginTimeoutId = setTimeout(() => {
          reject(new Error("Login timed out. Please try again."));
        }, 10000); // 10 seconds timeout
      });
      
      // Perform login with a timeout
      const loginPromise = login(
        normalizedData.email, 
        authValue, 
        normalizedData.role
      );
      
      // Race between login and timeout
      const success = await Promise.race([
        loginPromise,
        loginTimeoutPromise.then(() => false)
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
        
        // If login failed, try to sync again
        if (loginAttempts === 0) {
          setSyncBeforeLogin(true);
          
          // Set a timeout to stop the syncing indicator if it takes too long
          const syncTimeoutId = setTimeout(() => {
            setSyncBeforeLogin(false);
            setError("Sync timed out. Please try logging in again.");
            
            toast({
              title: "Sync Timeout",
              description: "Data synchronization is taking too long. Please try logging in again.",
              variant: "warning",
            });
          }, 8000); // 8 seconds timeout
          
          setSyncTimeout(syncTimeoutId);
          
          toast({
            title: "Login Failed",
            description: "Trying to sync with other devices to get the latest user data. Please try again after sync is complete.",
            variant: "warning",
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
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
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
                    <div className="relative mb-1">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your access code" 
                        className="pl-10" 
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the access code provided when your account was created
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <Button
            type="submit"
            className="w-full bg-nigeria-green hover:bg-nigeria-green-dark text-white"
            disabled={isLoading || contextLoading || syncBeforeLogin}
          >
            {isLoading || contextLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : syncBeforeLogin ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing Data...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          
          <div className="mt-4 text-center">
            <SyncStatusIndicator 
              showButton={true} 
              className="justify-center" 
              onSyncComplete={handleSyncComplete}
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
