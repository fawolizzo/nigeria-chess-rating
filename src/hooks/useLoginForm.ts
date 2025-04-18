
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
    });
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const { normalizedEmail, normalizedPassword } = normalizeCredentials(data.email, data.password);
      
      let success = false;
      
      if (data.role === "rating_officer") {
        // For rating officer, try local login directly
        try {
          // Ensure rating officer exists first
          await createInitialRatingOfficerIfNeeded();
          
          success = await localLogin(normalizedEmail, normalizedPassword, data.role);
          
          if (success) {
            toast({
              title: "Login Successful",
              description: "Welcome back! You are now logged in as a Rating Officer.",
            });
            
            navigate("/officer-dashboard");
            return;
          } else {
            throw new Error("Invalid access code for Rating Officer account");
          }
        } catch (error) {
          throw new Error("Invalid access code for Rating Officer account");
        }
      } else {
        // For tournament organizer, try Supabase login first, then fall back to local login
        try {
          success = await signIn(normalizedEmail, normalizedPassword);
          
          if (!success) {
            // If Supabase fails, try local login as fallback
            success = await localLogin(normalizedEmail, normalizedPassword, data.role);
          }
          
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
            return;
          } else {
            throw new Error("Invalid credentials. Please check your email and password.");
          }
        } catch (error) {
          throw error;
        }
      }
    } catch (error: any) {
      logMessage(LogLevel.ERROR, 'useLoginForm', 'Login error', {
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
