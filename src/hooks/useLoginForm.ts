
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
import createInitialRatingOfficerIfNeeded from "@/utils/createInitialRatingOfficer";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { signIn } = useSupabaseAuth();
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

  const selectedRole = form.watch("role");

  const handleRoleChange = async (role: "tournament_organizer" | "rating_officer") => {
    form.setValue("role", role);
    form.setValue("email", ""); // Ensure email is always cleared
    setError("");
    
    // Create rating officer if it doesn't exist
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
      
      console.log(`Attempting to login with email: ${normalizedEmail} and role: ${data.role}`);
      
      // For rating officer, always use direct login method
      if (data.role === "rating_officer") {
        console.log("Attempting Rating Officer login");
        
        // Create rating officer if it doesn't exist
        await createInitialRatingOfficerIfNeeded();
        
        const localSuccess = await localLogin(normalizedEmail, normalizedPassword, data.role);
        
        console.log(`Rating Officer login result: ${localSuccess ? "success" : "failed"}`);
        
        if (localSuccess) {
          logUserEvent("Login successful", undefined, { 
            email: normalizedEmail, 
            role: data.role 
          });
          
          toast({
            title: "Login Successful",
            description: "Welcome back! You are now logged in as a Rating Officer.",
          });
          
          // Navigate to rating officer dashboard - FIXED URL
          navigate("/officer-dashboard");
          return;
        } else {
          throw new Error("Invalid access code for Rating Officer account");
        }
      }
      
      // For tournament organizer, try both local and Supabase login
      console.log("Attempting Tournament Organizer login");
      let success = await localLogin(normalizedEmail, normalizedPassword, data.role);
      
      console.log(`Local login result for Tournament Organizer: ${success ? "success" : "failed"}`);
      
      // If local login fails, try Supabase
      if (!success) {
        console.log("Local login failed, trying Supabase login");
        success = await signIn(normalizedEmail, normalizedPassword);
        console.log(`Supabase login result: ${success ? "success" : "failed"}`);
      }
      
      if (success) {
        logUserEvent("Login successful", undefined, { email: normalizedEmail, role: data.role });
        
        toast({
          title: "Login Successful",
          description: "Welcome back! You are now logged in as a Tournament Organizer.",
        });
        
        // CHECK USER STATUS AFTER LOGIN
        // Get the current user from context after successful login
        if (currentUser && currentUser.status === "pending") {
          // Redirect pending users to the pending approval page
          console.log("User account is pending approval, redirecting to pending page");
          navigate("/pending-approval");
          return;
        }
        
        // Navigate to tournament organizer dashboard for approved users
        navigate("/organizer-dashboard");
      } else {
        logUserEvent("Login failed", undefined, { email: normalizedEmail, role: data.role });
        
        const errorMessage = "Invalid email or password for Tournament Organizer account. Please check your credentials and try again.";
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
