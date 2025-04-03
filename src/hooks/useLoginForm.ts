import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logUserEvent, logMessage, LogLevel } from "@/utils/debugLogger";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { LoginFormData, loginSchema } from "@/components/login/LoginFormInputs";
import { normalizeCredentials } from "@/services/auth";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { signIn, isLoading: authLoading } = useSupabaseAuth();
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
      
      const { normalizedEmail, normalizedPassword } = normalizeCredentials(data.email, data.password);
      
      console.log(`Attempting to login with email: ${normalizedEmail} and role: ${data.role}`);
      
      if (data.role === 'rating_officer') {
        console.log("This is a rating officer login attempt");
      }
      
      const success = await signIn(normalizedEmail, normalizedPassword);
      
      console.log(`Login attempt result: ${success ? 'success' : 'failed'}`);
      
      if (success) {
        logUserEvent("Login successful", undefined, { email: normalizedEmail, role: data.role });
        
        toast({
          title: "Login Successful",
          description: `Welcome back! You are now logged in as a ${data.role === 'tournament_organizer' ? 'Tournament Organizer' : 'Rating Officer'}.`,
        });
        
        setTimeout(() => {
          if (data.role === "tournament_organizer") {
            navigate("/organizer/dashboard");
          } else {
            navigate("/officer/dashboard");
          }
        }, 500);
      } else {
        logUserEvent("Login failed", undefined, { email: normalizedEmail, role: data.role });
        
        const roleDisplay = data.role === 'tournament_organizer' ? 'Tournament Organizer' : 'Rating Officer';
        setError(`Invalid email or password for ${roleDisplay} account. Please check your credentials and try again.`);
        
        toast({
          title: "Login Failed",
          description: `Invalid email or password for ${roleDisplay} account. Please check your credentials and try again.`,
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
    isLoading: isLoading || authLoading,
    error,
    showPassword,
    handleRoleChange,
    togglePasswordVisibility,
    onSubmit
  };
};
