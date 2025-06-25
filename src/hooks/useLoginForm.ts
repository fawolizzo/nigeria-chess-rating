import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { LoginFormData, loginSchema } from "@/components/login/LoginFormInputs";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useLoginForm = () => {
  const { login: localLogin } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [loginStage, setLoginStage] = useState("idle");
  const navigate = useNavigate();

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
      const highestTimeoutId = window.setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        window.clearTimeout(i);
      }
    };
  }, []);

  const handleRoleChange = (role: "tournament_organizer" | "rating_officer") => {
    logMessage(LogLevel.INFO, 'useLoginForm', 'Role changed', {
      previousRole: selectedRole,
      newRole: role,
    });
    
    form.setValue("role", role);
    
    // For Rating Officer, pre-fill with default email
    if (role === "rating_officer") {
      form.setValue("email", "ncro@ncr.com");
    } else {
      form.setValue("email", "");
    }
    
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
      if (data.role === "rating_officer") {
        setLoginStage("authenticating_rating_officer");
        try {
          logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting Rating Officer login with email:', data.email);
          // Always use default rating officer email
          data.email = "ncro@ncr.com";
          // Use Supabase Auth to sign in
          const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password, // access code
          });
          if (signInError) {
            throw new Error(signInError.message);
          }
          setLoginStage("success");
          toast({
            title: "Login Successful",
            description: "Welcome back! You are now logged in as a Rating Officer.",
          });
          logMessage(LogLevel.INFO, 'useLoginForm', 'Rating Officer login successful');
          navigate("/officer-dashboard");
        } catch (error: any) {
          logMessage(LogLevel.ERROR, 'useLoginForm', 'Rating Officer login error', {
            error: error.message,
            loginStage
          });
          setError(error.message || "Invalid access code for Rating Officer account");
          toast({
            title: "Login Failed",
            description: error.message || "Invalid access code for Rating Officer account",
            variant: "destructive"
          });
        }
      } else {
        setLoginStage("authenticating_tournament_organizer");
        try {
          logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting Tournament Organizer login with email:', data.email);
          if (data.email === "" || data.email.toLowerCase() === "org@ncr.com") {
            data.email = "org@ncr.com";
          }
          const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          if (signInError) {
            throw new Error(signInError.message);
          }
          setLoginStage("success");
          toast({
            title: "Login Successful",
            description: "Welcome back! You are now logged in as a Tournament Organizer.",
            duration: 3000,
          });
          navigate("/organizer-dashboard");
        } catch (error: any) {
          logMessage(LogLevel.ERROR, 'useLoginForm', 'Tournament Organizer login error', {
            error: error.message,
            loginStage
          });
          setError(error.message || "Invalid credentials. Please check your email and password.");
          toast({
            title: "Login Failed",
            description: error.message || "Invalid credentials. Please check your email and password.",
            variant: "destructive"
          });
        }
      }
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
    onSubmit,
    loginStage
  };
};
