
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { LoginFormData, loginSchema } from "@/components/login/LoginFormInputs";
import { normalizeCredentials } from "@/services/auth";
import { useUser } from "@/contexts/UserContext";
import createInitialRatingOfficerIfNeeded from "@/utils/createInitialRatingOfficer";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { signIn } = useSupabaseAuth();
  const { login: localLogin, currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
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

  const handleRoleChange = async (role: "tournament_organizer" | "rating_officer") => {
    logMessage(LogLevel.INFO, 'useLoginForm', 'Role changed', {
      previousRole: selectedRole,
      newRole: role,
      timestamp: new Date().toISOString()
    });
    
    form.setValue("role", role);
    form.setValue("email", ""); // Clear email when role changes
    setError("");
    
    if (role === "rating_officer") {
      try {
        await createInitialRatingOfficerIfNeeded();
      } catch (error) {
        logMessage(LogLevel.ERROR, 'useLoginForm', 'Error creating initial rating officer', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormData) => {
    logMessage(LogLevel.INFO, 'useLoginForm', 'Login form submitted', {
      email: data.email,
      role: data.role,
      timestamp: new Date().toISOString()
    });
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const { normalizedEmail, normalizedPassword } = normalizeCredentials(data.email, data.password);
      
      // Create a login timeout
      const loginTimeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setError("Login request timed out. Please try again.");
          
          toast({
            title: "Login Timeout",
            description: "Request took too long. Please try again.",
            variant: "destructive",
          });
        }
      }, 15000); // 15 second timeout
      
      // Try login based on role
      let success = false;
      
      if (data.role === "rating_officer") {
        logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting rating officer login', {
          timestamp: new Date().toISOString()
        });
        
        // Ensure rating officer exists
        await createInitialRatingOfficerIfNeeded();
        
        try {
          success = await localLogin(normalizedEmail, normalizedPassword, data.role);
        } catch (error) {
          throw new Error("Invalid access code for Rating Officer account");
        }
        
        if (success) {
          clearTimeout(loginTimeout);
          
          toast({
            title: "Login Successful",
            description: "Welcome back! You are now logged in as a Rating Officer.",
          });
          
          navigate("/officer-dashboard");
          return;
        } else {
          throw new Error("Invalid access code for Rating Officer account");
        }
      } else {
        // For tournament organizer, try Supabase login
        logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting tournament organizer login', {
          timestamp: new Date().toISOString()
        });
        
        try {
          // First try Supabase sign in
          success = await signIn(normalizedEmail, normalizedPassword);
        } catch (error) {
          logMessage(LogLevel.ERROR, 'useLoginForm', 'Supabase sign in failed, trying local login', {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          });
          
          // If Supabase fails, try local login
          success = await localLogin(normalizedEmail, normalizedPassword, data.role);
        }
        
        clearTimeout(loginTimeout);
        
        if (success) {
          toast({
            title: "Login Successful",
            description: "Welcome back! You are now logged in as a Tournament Organizer.",
          });
          
          // Check user status for proper redirection
          if (currentUser && currentUser.status === "pending") {
            navigate("/pending-approval");
            return;
          }
          
          navigate("/organizer-dashboard");
        } else {
          const errorMessage = "Invalid credentials. Please check your email and password.";
          setError(errorMessage);
          
          toast({
            title: "Login Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      logMessage(LogLevel.ERROR, 'useLoginForm', 'Login error', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
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
