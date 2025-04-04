
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logUserEvent, logMessage, LogLevel } from "@/utils/debugLogger";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { LoginFormData, loginSchema } from "@/components/login/LoginFormInputs";
import { normalizeCredentials } from "@/services/auth";
import { useUser } from "@/contexts/UserContext";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { signIn } = useSupabaseAuth();
  const { login: localLogin } = useUser();
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
      
      console.log(`Attempting to login with email: ${normalizedEmail} and role: ${data.role}`);
      
      // First try local login directly
      const localSuccess = await localLogin(normalizedEmail, normalizedPassword, data.role);
      
      console.log(`Local login result for ${data.role}: ${localSuccess ? "success" : "failed"}`);
      
      let success = localSuccess;
      
      // If local login fails and it's a tournament organizer, try Supabase
      if (!success && data.role === "tournament_organizer") {
        console.log("Local login failed, trying Supabase login");
        success = await signIn(normalizedEmail, normalizedPassword);
        console.log(`Supabase login result: ${success ? "success" : "failed"}`);
      }
      
      if (success) {
        logUserEvent("Login successful", undefined, { email: normalizedEmail, role: data.role });
        
        toast({
          title: "Login Successful",
          description: `Welcome back! You are now logged in as a ${data.role === 'tournament_organizer' ? 'Tournament Organizer' : 'Rating Officer'}.`,
        });
        
        // Navigate immediately instead of using a timeout
        if (data.role === "tournament_organizer") {
          navigate("/organizer/dashboard");
        } else {
          navigate("/officer/dashboard");
        }
      } else {
        logUserEvent("Login failed", undefined, { email: normalizedEmail, role: data.role });
        
        const roleDisplay = data.role === 'tournament_organizer' ? 'Tournament Organizer' : 'Rating Officer';
        const fieldName = data.role === 'tournament_organizer' ? 'password' : 'access code';
        
        const errorMessage = `Invalid email or ${fieldName} for ${roleDisplay} account. Please check your credentials and try again.`;
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
