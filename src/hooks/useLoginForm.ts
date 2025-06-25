import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { LoginFormData, loginSchema } from "@/components/login/LoginFormInputs";
import { useUser } from "@/contexts/UserContext";

export const useLoginForm = (setErrorExternal?: (msg: string) => void) => {
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
    if (setErrorExternal) setErrorExternal("");
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
    if (setErrorExternal) setErrorExternal("");
    setLoginStage("starting");
    try {
      setLoginStage("validating_input");
      if (data.role === "rating_officer") {
        setLoginStage("authenticating_rating_officer");
        try {
          logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting Rating Officer login with email:', data.email);
          data.email = "ncro@ncr.com";
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Login timed out")), 5000);
          });
          const success = await Promise.race([
            localLogin(data.email, data.password, data.role),
            timeoutPromise
          ]) as boolean;
          if (success) {
            setLoginStage("success");
            toast({
              title: "Login Successful",
              description: "Welcome back! You are now logged in as a Rating Officer.",
            });
            logMessage(LogLevel.INFO, 'useLoginForm', 'Rating Officer login successful');
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
        setLoginStage("authenticating_tournament_organizer");
        try {
          logMessage(LogLevel.INFO, 'useLoginForm', 'Attempting Tournament Organizer login with email:', data.email);
          if (data.email === "" || data.email.toLowerCase() === "org@ncr.com") {
            data.email = "org@ncr.com";
          }
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Login timed out")), 5000);
          });
          const success = await Promise.race([
            localLogin(data.email, data.password, data.role),
            timeoutPromise
          ]) as boolean;
          setLoginStage(success ? "success" : "failed");
          if (success) {
            logMessage(LogLevel.INFO, 'useLoginForm', 'Tournament Organizer login successful');
            toast({
              title: "Login Successful",
              description: "Welcome back! You are now logged in as a Tournament Organizer.",
              duration: 3000,
            });
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
      if (setErrorExternal) setErrorExternal(error.message || "An unexpected error occurred during login.");
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
      setLoginStage("error");
    } finally {
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
