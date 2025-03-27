
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Calendar, Shield, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { forceSyncAllStorage, checkStorageHealth } from "@/utils/storageUtils";
import { checkResetStatus, clearResetStatus } from "@/utils/storageSync";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["tournament_organizer", "rating_officer"]),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, currentUser, refreshUserData } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const isMobile = useIsMobile();
  
  // Force sync storage and check health on page load
  useEffect(() => {
    const initializeLogin = async () => {
      console.log("[LoginForm] Initializing login form");
      setIsSyncing(true);
      
      try {
        // Check for system reset
        if (checkResetStatus()) {
          console.log("[LoginForm] System reset detected, clearing reset status");
          clearResetStatus();
          toast({
            title: "System Reset Detected",
            description: "The system has been reset. All account data has been cleared.",
          });
        }
        
        // Check storage health
        await checkStorageHealth();
        
        // Force sync all storage
        const syncResult = await forceSyncAllStorage();
        
        if (!syncResult) {
          console.warn("[LoginForm] Storage sync issues detected");
          toast({
            title: "Storage Sync Warning",
            description: "There may be issues with data synchronization. If login fails, try clearing your browser cache.",
            variant: "warning"
          });
        } else {
          console.log("[LoginForm] Storage synced successfully");
        }
      } catch (error) {
        console.error("[LoginForm] Error initializing login form:", error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    initializeLogin();
  }, [toast]);
  
  // Handle redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      console.log(`[LoginForm] User already logged in: ${currentUser.email}, redirecting...`);
      if (currentUser.role === "tournament_organizer") {
        navigate("/organizer/dashboard");
      } else {
        navigate("/officer/dashboard");
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
  
  // Manual sync button handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    setErrorMessage("");
    
    try {
      // Check storage health
      await checkStorageHealth();
      
      // Force sync all storage
      const syncResult = await forceSyncAllStorage();
      
      // Refresh user data from context
      refreshUserData();
      
      if (syncResult) {
        toast({
          title: "Sync Complete",
          description: "User data has been synchronized successfully.",
        });
      } else {
        toast({
          title: "Sync Issues",
          description: "There were some issues synchronizing data. You may want to try clearing your browser cache.",
          variant: "warning"
        });
      }
    } catch (error) {
      console.error("[LoginForm] Error during manual sync:", error);
      toast({
        title: "Sync Failed",
        description: "There was a problem synchronizing your data. Please try again or clear your browser cache.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      console.log(`[LoginForm] Login attempt - Email: ${data.email}, Role: ${data.role}`);
      
      // Ensure storage is synced before login attempt
      const syncResult = await forceSyncAllStorage();
      
      if (!syncResult) {
        console.warn("[LoginForm] Storage sync issues detected during login attempt");
        toast({
          title: "Storage Sync Warning",
          description: "There may be issues with data synchronization. If login fails, try using the 'Sync Data' button.",
          variant: "warning"
        });
      }
      
      setErrorMessage("");
      
      const normalizedEmail = data.email.toLowerCase().trim();
      
      const success = await login(
        normalizedEmail, 
        data.password, 
        data.role as 'tournament_organizer' | 'rating_officer'
      );
      
      if (success) {
        setSuccessMessage("Login successful!");
        console.log("[LoginForm] Login successful, redirecting...");
        
        // Slight delay to allow state to update
        setTimeout(() => {
          if (data.role === "tournament_organizer") {
            navigate("/organizer/dashboard", { replace: true });
          } else {
            navigate("/officer/dashboard", { replace: true });
          }
        }, 500);
      } else {
        console.log("[LoginForm] Login failed in component");
        setErrorMessage("Invalid credentials or your account is pending approval");
        
        // No toast here as the login function already shows one
      }
    } catch (error: any) {
      console.error("[LoginForm] Login error in component:", error);
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
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={handleManualSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? "Syncing..." : "Sync Data"}
        </Button>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Use this if you're having trouble logging in on a different device
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
          <p className="ml-3 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
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
            disabled={isSubmitting || isSyncing}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
