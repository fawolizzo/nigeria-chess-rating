
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, Calendar, Shield, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import { useUser } from "@/contexts/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { forceSyncAllStorage } from "@/utils/storageUtils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["tournament_organizer", "rating_officer"]),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isMobile = useIsMobile();
  
  // Force sync storage on page load to ensure cross-device consistency
  useEffect(() => {
    forceSyncAllStorage();
    console.log("[Login] Storage synced on page load");
  }, []);
  
  useEffect(() => {
    if (currentUser) {
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
  
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      console.log(`[Login] Login attempt - Email: ${data.email}, Role: ${data.role}`);
      
      // Ensure storage is synced before login attempt
      forceSyncAllStorage();
      
      setErrorMessage("");
      
      const normalizedEmail = data.email.toLowerCase().trim();
      
      const success = await login(
        normalizedEmail, 
        data.password, 
        data.role as 'tournament_organizer' | 'rating_officer'
      );
      
      if (success) {
        setSuccessMessage("Login successful!");
        console.log("[Login] Login successful, redirecting...");
        
        toast({
          title: "Login Successful",
          description: "Welcome to the Nigerian Chess Rating System",
          variant: "default",
        });
        
        setTimeout(() => {
          if (data.role === "tournament_organizer") {
            navigate("/organizer/dashboard", { replace: true });
          } else {
            navigate("/officer/dashboard", { replace: true });
          }
        }, 500);
      } else {
        console.log("[Login] Login failed in component");
        setErrorMessage("Invalid credentials or your account is pending approval");
        
        toast({
          title: "Login Failed",
          description: "Invalid credentials or your account is pending approval",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("[Login] Login error in component:", error);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
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
                  disabled={isSubmitting}
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
                
                <div className="mt-4 text-center text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-nigeria-green dark:text-nigeria-green-light font-medium hover:underline">
                      Register
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
