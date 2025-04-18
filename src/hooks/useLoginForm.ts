
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
  const { signIn, isAuthenticated, isLoading: authLoading, user, session } = useSupabaseAuth();
  const { login: localLogin, currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { toast } = useToast();

  // Log hook initialization
  useEffect(() => {
    logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Hook initialized', {
      pathname: location.pathname,
      isAuthenticated,
      authLoading,
      hasCurrentUser: !!currentUser,
      hasSupabaseUser: !!user,
      hasSupabaseSession: !!session,
      timestamp: new Date().toISOString()
    });
  }, [location.pathname, isAuthenticated, authLoading, currentUser, user, session]);

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
    logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Auth state check', {
      authLoading,
      isAuthenticated,
      hasCurrentUser: !!currentUser,
      hasSupabaseUser: !!user,
      hasSupabaseSession: !!session,
      timestamp: new Date().toISOString()
    });
    
    if (!authLoading && (isAuthenticated || currentUser)) {
      logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] User authenticated, preparing redirect', {
        role: currentUser?.role,
        status: currentUser?.status,
        timestamp: new Date().toISOString()
      });
      
      // Handle redirect based on role
      if (currentUser?.role === 'rating_officer') {
        logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Redirecting to officer dashboard', {
          timestamp: new Date().toISOString()
        });
        navigate('/officer-dashboard');
      } else if (currentUser?.role === 'tournament_organizer') {
        if (currentUser.status === 'pending') {
          logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Redirecting to pending approval', {
            timestamp: new Date().toISOString()
          });
          navigate('/pending-approval');
        } else if (currentUser.status === 'approved') {
          logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Redirecting to organizer dashboard', {
            timestamp: new Date().toISOString()
          });
          navigate('/organizer-dashboard');
        }
      }
    }
  }, [isAuthenticated, authLoading, currentUser, navigate, user, session]);

  const selectedRole = form.watch("role");

  const handleRoleChange = async (role: "tournament_organizer" | "rating_officer") => {
    logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Role changed', {
      previousRole: selectedRole,
      newRole: role,
      timestamp: new Date().toISOString()
    });
    
    form.setValue("role", role);
    form.setValue("email", ""); // Clear email when role changes
    setError("");
    
    if (role === "rating_officer") {
      try {
        logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Creating initial rating officer if needed', {
          timestamp: new Date().toISOString()
        });
        await createInitialRatingOfficerIfNeeded();
      } catch (error) {
        logMessage(LogLevel.ERROR, 'useLoginForm', '[DIAGNOSTICS] Error creating initial rating officer', {
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
    logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Login form submitted', {
      email: data.email,
      role: data.role,
      timestamp: new Date().toISOString()
    });
    
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
      
      logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Login attempt processing', {
        email: normalizedEmail,
        role: data.role,
        timestamp: new Date().toISOString()
      });
      
      // For rating officer, use direct login
      if (data.role === "rating_officer") {
        logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Attempting rating officer login', {
          timestamp: new Date().toISOString()
        });
        
        // Ensure rating officer exists
        await createInitialRatingOfficerIfNeeded();
        
        const startTime = Date.now();
        const localSuccess = await localLogin(normalizedEmail, normalizedPassword, data.role);
        
        logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Rating officer login result', {
          success: localSuccess,
          duration: `${Date.now() - startTime}ms`,
          timestamp: new Date().toISOString()
        });
        
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
      logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Attempting tournament organizer login', {
        timestamp: new Date().toISOString()
      });
      
      let localStartTime = Date.now();
      let success = await localLogin(normalizedEmail, normalizedPassword, data.role);
      
      logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Tournament organizer local login result', {
        success,
        duration: `${Date.now() - localStartTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      // If local login fails, try Supabase
      if (!success) {
        logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Local login failed, trying Supabase', {
          timestamp: new Date().toISOString()
        });
        
        const supabaseStartTime = Date.now();
        success = await signIn(normalizedEmail, normalizedPassword);
        
        logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] Supabase login result', {
          success,
          duration: `${Date.now() - supabaseStartTime}ms`,
          timestamp: new Date().toISOString()
        });
      }
      
      if (success) {
        logUserEvent("Login successful", undefined, { role: data.role });
        
        toast({
          title: "Login Successful",
          description: "Welcome back! You are now logged in as a Tournament Organizer.",
        });
        
        // Check user status for proper redirection
        if (currentUser && currentUser.status === "pending") {
          logMessage(LogLevel.INFO, 'useLoginForm', '[DIAGNOSTICS] User pending approval, redirecting to pending page', {
            timestamp: new Date().toISOString()
          });
          navigate("/pending-approval");
          return;
        }
        
        navigate("/organizer-dashboard");
      } else {
        logUserEvent("Login failed", undefined, { role: data.role });
        
        const errorMessage = "Invalid credentials. Please check your email and password.";
        setError(errorMessage);
        
        logMessage(LogLevel.ERROR, 'useLoginForm', '[DIAGNOSTICS] Authentication failed', {
          email: normalizedEmail,
          role: data.role,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      logMessage(LogLevel.ERROR, 'useLoginForm', '[DIAGNOSTICS] Login error', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
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
