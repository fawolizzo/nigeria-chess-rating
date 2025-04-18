
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logUserEvent, logMessage, LogLevel } from "@/utils/debugLogger";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { LoginFormData, loginSchema } from "@/components/login/LoginFormInputs";
import { normalizeCredentials } from "@/services/auth";
import { useUser } from "@/contexts/UserContext";
import createInitialRatingOfficerIfNeeded from "@/utils/createInitialRatingOfficer";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const { login: localLogin, currentUser } = useUser();
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

  // Check for authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser) {
      logMessage(LogLevel.INFO, 'useLoginForm', 'User authenticated, redirecting', {
        role: currentUser.role,
        status: currentUser.status
      });
      
      // Handle redirect based on role
      if (currentUser.role === 'rating_officer') {
        navigate('/officer-dashboard');
      } else if (currentUser.role === 'tournament_organizer') {
        if (currentUser.status === 'pending') {
          navigate('/pending-approval');
        } else if (currentUser.status === 'approved') {
          navigate('/organizer-dashboard');
        }
      }
    }
  }, [isAuthenticated, authLoading, currentUser, navigate]);

  const selectedRole = form.watch("role");

  const handleRoleChange = async (role: "tournament_organizer" | "rating_officer") => {
    form.setValue("role", role);
    form.setValue("email", ""); // Clear email when role changes
    setError("");
    
    if (role === "rating_officer") {
      try {
        await createInitialRatingOfficerIfNeeded();
      } catch (error) {
        console.error("Error creating initial rating officer:", error);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      logUserEvent("Login attempt", undefined, { 
        email: data.email, 
        role: data.role,
        attempts: loginAttempts + 1
      });
      
      setLoginAttempts(prev => prev + 1);
      
      const { normalizedEmail, normalizedPassword } = normalizeCredentials(data.email, data.password);
      
      logMessage(LogLevel.INFO, 'useLoginForm', 'Login attempt', {
        email: normalizedEmail,
        role: data.role
      });
      
      // For rating officer, use direct login
      if (data.role === "rating_officer") {
        logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting rating officer login');
        
        // Ensure rating officer exists
        await createInitialRatingOfficerIfNeeded();
        
        const localSuccess = await localLogin(normalizedEmail, normalizedPassword, data.role);
        
        if (localSuccess) {
          logUserEvent("Login successful", undefined, { role: data.role });
          
          toast({
            title: "Login Successful",
            description: "Welcome back! You are now logged in as a Rating Officer.",
          });
          
          navigate("/officer-dashboard");
          return;
        } else {
          throw new Error("Invalid access code for Rating Officer account");
        }
      }
      
      // For tournament organizer, try both local and Supabase login
      logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting tournament organizer login');
      
      let success = await localLogin(normalizedEmail, normalizedPassword, data.role);
      
      // If local login fails, try Supabase
      if (!success) {
        logMessage(LogLevel.INFO, 'useLoginForm', 'Local login failed, trying Supabase');
        success = await signIn(normalizedEmail, normalizedPassword);
      }
      
      if (success) {
        logUserEvent("Login successful", undefined, { role: data.role });
        
        toast({
          title: "Login Successful",
          description: "Welcome back! You are now logged in as a Tournament Organizer.",
        });
        
        // Check user status for proper redirection
        if (currentUser && currentUser.status === "pending") {
          logMessage(LogLevel.INFO, 'useLoginForm', 'User pending approval, redirecting to pending page');
          navigate("/pending-approval");
          return;
        }
        
        navigate("/organizer-dashboard");
      } else {
        logUserEvent("Login failed", undefined, { role: data.role });
        
        const errorMessage = "Invalid credentials. Please check your email and password.";
        setError(errorMessage);
        
        toast({
          title: "Login Failed",
          description: errorMessage,
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

  return {
    form,
    selectedRole,
    isLoading,
    error,
    showPassword,
    handleRoleChange,
    togglePasswordVisibility,
    onSubmit
  };
};
