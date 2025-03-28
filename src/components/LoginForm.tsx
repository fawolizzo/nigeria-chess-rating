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
  RefreshCw,
  Loader2
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
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER } from "@/types/userTypes";
import { requestDataSync } from "@/utils/deviceSync";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["tournament_organizer", "rating_officer"]),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, currentUser, refreshUserData, forceSync } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const isMobile = useIsMobile();
  
  // Initialize login form
  useEffect(() => {
    const initializeLogin = async () => {
      console.log("[LoginForm] Initializing login form");
      setIsSyncing(true);
      
      try {
        // Request sync from other devices
        requestDataSync();
        
        // Wait a bit to allow sync to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh user context data
        await refreshUserData();
        
        console.log("[LoginForm] Login form initialization complete");
      } catch (error) {
        console.error("[LoginForm] Error initializing login form:", error);
        
        toast({
          title: "Initialization Error",
          description: "Failed to initialize login form. Please try refreshing the page.",
          variant: "destructive"
        });
      } finally {
        setIsSyncing(false);
        setInitComplete(true);
      }
    };
    
    initializeLogin();
  }, [toast, refreshUserData, forceSync]);
  
  // Handle redirect if user is already logged in
  useEffect(() => {
    if (currentUser && initComplete) {
      console.log(`[LoginForm] User already logged in: ${currentUser.email}, redirecting...`);
      
      if (currentUser.role === "tournament_organizer") {
        navigate("/organizer/dashboard", { replace: true });
      } else {
        navigate("/officer/dashboard", { replace: true });
      }
    }
  }, [currentUser, navigate, initComplete]);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "tournament_organizer",
    }
  });
  
  const selectedRole = form.watch("role");
  
  // Handle manual sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    setErrorMessage("");
    
    try {
      // Perform global sync
      const syncResult = await forceSync();
      
      if (syncResult) {
        // Refresh user data
        await refreshUserData();
        
        toast({
          title: "Sync Complete",
          description: "Data has been synchronized successfully across all devices.",
        });
      } else {
        toast({
          title: "Sync Issues",
          description: "There were some issues synchronizing data. Please try again.",
          variant: "warning"
        });
      }
    } catch (error) {
      console.error("[LoginForm] Error during manual sync:", error);
      
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize data. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Handle login form submission
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      console.log(`[LoginForm] Login attempt - Email: ${data.email}, Role: ${data.role}`);
      
      // Force sync before login attempt
      await forceSync();
      
      // Normalize email
      const normalizedEmail = data.email.toLowerCase().trim();
      
      // Attempt login
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
        console.log("[LoginForm] Login failed");
        setErrorMessage("Invalid credentials or your account is pending approval");
      }
    } catch (error: any) {
      console.error("[LoginForm] Login error:", error);
      
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

  if (!initComplete) {
    return (
      <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Initializing login system...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Login</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to your Nigeria Chess Rating System account
        </p>
        
        <div className="mt-3 flex justify-center">
          <SyncStatusIndicator showButton={true} />
        </div>
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
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 h-8 text-xs"
              onClick={handleManualSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Syncing..." : "Sync Data & Try Again"}
            </Button>
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
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
