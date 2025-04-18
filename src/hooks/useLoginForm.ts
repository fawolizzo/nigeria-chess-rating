
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { supabase } from "@/integrations/supabase/client";
import { LoginFormData, loginSchema } from "@/components/login/LoginFormInputs";
import { useUser } from "@/contexts/UserContext";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login: localLogin } = useUser();
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
    
    try {
      let success = false;
      
      if (data.role === "rating_officer") {
        // For rating officer, try local login directly
        try {
          success = await localLogin(data.email, data.password, data.role);
          
          if (success) {
            toast({
              title: "Login Successful",
              description: "Welcome back! You are now logged in as a Rating Officer.",
            });
            
            navigate("/officer-dashboard");
          } else {
            throw new Error("Invalid access code for Rating Officer account");
          }
        } catch (error) {
          throw new Error("Invalid access code for Rating Officer account");
        }
      } else {
        // For tournament organizer, try Supabase login first
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: data.email.toLowerCase().trim(),
            password: data.password,
          });
          
          if (authError) {
            // If Supabase fails, try local login as fallback
            success = await localLogin(data.email, data.password, data.role);
            
            if (!success) {
              throw new Error("Invalid credentials. Please check your email and password.");
            }
          } else {
            success = true;
          }
          
          if (success) {
            toast({
              title: "Login Successful",
              description: "Welcome back! You are now logged in as a Tournament Organizer.",
            });
            
            navigate("/organizer-dashboard");
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
