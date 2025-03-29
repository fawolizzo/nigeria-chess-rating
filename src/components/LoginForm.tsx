
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { logUserEvent, logMessage, LogLevel } from "@/utils/debugLogger";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

// Schema for login form
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["tournament_organizer", "rating_officer"])
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const { signIn, isLoading: authLoading, isRatingOfficer, isTournamentOrganizer } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { toast } = useToast();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "tournament_organizer"
    }
  });
  
  const selectedRole = form.watch("role");
  
  const handleRoleChange = (role: "tournament_organizer" | "rating_officer") => {
    form.setValue("role", role);
    setError("");
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const onSubmit = async (data: LoginFormData) => {
    // Prevent multiple simultaneous submissions
    if (isLoading || authLoading) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      logUserEvent("Login attempt", undefined, { 
        email: data.email, 
        role: data.role,
        attempts: loginAttempts + 1
      });
      
      setLoginAttempts(prev => prev + 1);
      
      const normalizedEmail = data.email.toLowerCase().trim();
      const normalizedPassword = data.password.trim();
      
      // Attempt to sign in with Supabase Auth
      const success = await signIn(normalizedEmail, normalizedPassword);
      
      if (success) {
        logUserEvent("Login successful", undefined, { email: data.email, role: data.role });
        
        // Check if the user has the correct role
        if (data.role === "rating_officer" && !isRatingOfficer) {
          // User logged in but doesn't have the rating officer role
          logMessage(LogLevel.WARNING, 'LoginForm', `User logged in but doesn't have rating officer role: ${normalizedEmail}`);
          setError(`No rating officer account found with email ${data.email}`);
          
          // Sign out the user
          // We'll use a small timeout to allow the auth state to update first
          setTimeout(() => {
            useSupabaseAuth().signOut();
          }, 0);
          
          return;
        }
        
        if (data.role === "tournament_organizer" && !isTournamentOrganizer) {
          // User logged in but doesn't have the tournament organizer role
          logMessage(LogLevel.WARNING, 'LoginForm', `User logged in but doesn't have tournament organizer role: ${normalizedEmail}`);
          setError(`No tournament organizer account found with email ${data.email}`);
          
          // Sign out the user
          setTimeout(() => {
            useSupabaseAuth().signOut();
          }, 0);
          
          return;
        }
        
        // Check if the tournament organizer is approved
        if (data.role === "tournament_organizer" && useSupabaseAuth().user?.user_metadata?.status !== 'approved') {
          logMessage(LogLevel.WARNING, 'LoginForm', `Tournament organizer not approved: ${normalizedEmail}`);
          setError("Your account is pending approval by a rating officer.");
          
          // Sign out the user
          setTimeout(() => {
            useSupabaseAuth().signOut();
          }, 0);
          
          return;
        }
        
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
        
        setError("Invalid email or password. Please check and try again.");
        
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please check and try again.",
          variant: "destructive",
        });
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
    } finally {
      setIsLoading(false);
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
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{selectedRole === "rating_officer" ? "Access Code" : "Password"}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder={selectedRole === "rating_officer" ? "Enter your access code" : "Enter your password"}
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
          
          <Button
            type="submit"
            className="w-full bg-nigeria-green hover:bg-nigeria-green-dark dark:bg-nigeria-green-light dark:hover:bg-nigeria-green"
            disabled={isLoading || authLoading}
          >
            {isLoading || authLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
