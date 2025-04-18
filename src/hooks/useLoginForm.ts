
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { supabase } from "@/integrations/supabase/client";
import { LoginFormData, loginSchema } from "@/components/login/LoginFormInputs";
import { useUser } from "@/contexts/UserContext";
import { signInWithEmailAndPassword } from "@/services/auth/loginService";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login: localLogin } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [loginStage, setLoginStage] = useState("idle");

  // Form setup with validation
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "tournament_organizer"
    }
  });

  const selectedRole = form.watch("role");

  // Clear any existing login timers on unmount
  useEffect(() => {
    return () => {
      // Find and clear any timers that might be running
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
    };
  }, []);

  const handleRoleChange = (role: "tournament_organizer" | "rating_officer") => {
    logMessage(LogLevel.INFO, 'useLoginForm', 'Role changed', {
      previousRole: selectedRole,
      newRole: role,
    });
    
    form.setValue("role", role);
    form.setValue("email", ""); // Clear email when role changes
    setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormData) => {
    logMessage(LogLevel.INFO, 'useLoginForm', 'Login form submitted', {
      email: data.email,
      role: data.role,
    });
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    setLoginStage("starting");
    
    try {
      setLoginStage("validating_input");
      let success = false;
      
      if (data.role === "rating_officer") {
        // For rating officer, use local login with specific error handling
        setLoginStage("authenticating_rating_officer");
        
        try {
          logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting Rating Officer login');
          
          // Create a timeout promise
          const loginPromise = localLogin(data.email, data.password, data.role);
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error("Login timed out")), 15000);
          });
          
          // Race the login against a timeout
          success = await Promise.race([loginPromise, timeoutPromise]);
          
          if (success) {
            setLoginStage("success");
            
            toast({
              title: "Login Successful",
              description: "Welcome back! You are now logged in as a Rating Officer.",
            });
            
            navigate("/officer-dashboard");
          } else {
            throw new Error("Invalid access code for Rating Officer account");
          }
        } catch (error: any) {
          logMessage(LogLevel.ERROR, 'useLoginForm', 'Rating Officer login error', { 
            error: error.message,
            loginStage
          });
          
          throw new Error(
            error.message === "Login timed out" 
              ? "Authentication timed out. Please try again." 
              : "Invalid access code for Rating Officer account"
          );
        }
      } else {
        // For tournament organizer, use enhanced login service with timeouts
        setLoginStage("authenticating_tournament_organizer");
        
        try {
          logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting Tournament Organizer login via service');
          
          // Use the enhanced login service that handles both Supabase and local login
          success = await signInWithEmailAndPassword(
            data.email, 
            data.password,
            localLogin
          );
          
          setLoginStage(success ? "success" : "failed");
          
          if (success) {
            toast({
              title: "Login Successful",
              description: "Welcome back! You are now logged in as a Tournament Organizer.",
            });
            
            // Note: Navigation will happen automatically via the Login.tsx component
            // based on user role and status
          } else {
            throw new Error("Invalid credentials. Please check your email and password.");
          }
        } catch (error: any) {
          logMessage(LogLevel.ERROR, 'useLoginForm', 'Tournament Organizer login error', { 
            error: error.message,
            loginStage
          });
          
          throw error;
        }
      }
    } catch (error: any) {
      logMessage(LogLevel.ERROR, 'useLoginForm', `Login error at stage: ${loginStage}`, {
        error: error.message,
        stack: error.stack,
      });
      
      setError(error.message || "An unexpected error occurred during login.");
      
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      // Only set loading to false if we're not in a success state
      // This prevents flashing the form before navigation
      if (loginStage !== "success") {
        setIsLoading(false);
      }
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
    onSubmit,
    loginStage
  };
};
