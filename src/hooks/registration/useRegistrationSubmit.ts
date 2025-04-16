
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { logUserEvent, LogLevel, logMessage } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import type { RegisterFormData } from "@/components/register/RegisterFormSchema";

// Default rating officer email
const DEFAULT_RATING_OFFICER_EMAIL = "fawolizzo@gmail.com";

export const useRegistrationSubmit = (
  accessCode: string,
  isAccessCodeValid: boolean,
  RATING_OFFICER_ACCESS_CODE: string
) => {
  const navigate = useNavigate();
  const { register: registerInLocalSystem } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [registrationAttempts, setRegistrationAttempts] = useState(0);
  const { toast } = useToast();

  // Validate access code for rating officers
  const validateRatingOfficerAccessCode = (role: string): boolean => {
    if (role === "rating_officer") {
      if (accessCode !== RATING_OFFICER_ACCESS_CODE) {
        setErrorMessage("Invalid access code for Rating Officer registration");
        toast({
          title: "Invalid Access Code",
          description: "Please enter a valid access code for Rating Officer registration",
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  // Validate password for tournament organizers
  const validateTournamentOrganizerPassword = (data: RegisterFormData): boolean => {
    if (data.role === "tournament_organizer" && !data.password) {
      setErrorMessage("Password is required for Tournament Organizer registration");
      toast({
        title: "Password Required",
        description: "Please enter a password for your Tournament Organizer account",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Register a rating officer (directly in local system only)
  const registerRatingOfficer = async (normalizedData: any): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'RegistrationSubmit', `Attempting to register rating officer with email: ${normalizedData.email}`);
      
      // For Rating Officers in UAT, use the email provided by the user
      const success = await registerInLocalSystem({
        fullName: normalizedData.fullName,
        email: normalizedData.email, // Use the user-provided email
        phoneNumber: normalizedData.phoneNumber,
        state: normalizedData.state,
        role: "rating_officer" as const,
        status: "approved" as const,
        accessCode: RATING_OFFICER_ACCESS_CODE
      });
      
      if (!success) {
        throw new Error("Failed to register Rating Officer in local system");
      }
      
      logMessage(LogLevel.INFO, 'RegistrationSubmit', `Successfully registered rating officer: ${normalizedData.email}`);
      return true;
    } catch (error) {
      console.error("Error registering rating officer:", error);
      logMessage(LogLevel.ERROR, 'RegistrationSubmit', `Error registering rating officer: ${normalizedData.email}`, error);
      throw error;
    }
  };

  // Register a tournament organizer
  const registerTournamentOrganizer = async (normalizedData: any): Promise<boolean> => {
    try {
      // First register in Supabase
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
        email: normalizedData.email,
        password: normalizedData.password,
        options: {
          data: {
            fullName: normalizedData.fullName,
            phoneNumber: normalizedData.phoneNumber,
            state: normalizedData.state,
            role: "tournament_organizer",
            status: "pending"
          }
        }
      });
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      if (!supabaseData.user) {
        throw new Error("Registration failed - no user data returned");
      }
      
      // Then register in local system as backup
      await registerInLocalSystem({
        fullName: normalizedData.fullName,
        email: normalizedData.email,
        phoneNumber: normalizedData.phoneNumber,
        state: normalizedData.state,
        role: "tournament_organizer" as const,
        status: "pending" as const
      });
      
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Display success message and redirect to login
  const handleRegistrationSuccess = (role: string, email: string) => {
    const message = role === "tournament_organizer"
      ? "Registration successful! Your account is pending approval by a rating officer."
      : "Rating Officer account created successfully! You can now log in.";
    
    setSuccessMessage(message);
    
    toast({
      title: "Registration successful!",
      description: role === "rating_officer" 
        ? "Your Rating Officer account has been created. You can now log in."
        : "Your account has been created. A rating officer will review and approve your account.",
      variant: "default"
    });
    
    // Add a small delay before redirecting to ensure the toast is seen
    setTimeout(() => {
      navigate("/login");
    }, 3000);
    
    return true;
  };

  // Handle registration failure
  const handleRegistrationFailure = (error: any) => {
    console.error("Registration failed:", error);
    
    setErrorMessage("Registration failed. Please try again with a different email address.");
    
    toast({
      title: "Registration Failed",
      description: "There was an issue with your registration. Please try again with a different email.",
      variant: "destructive",
    });
    
    return false;
  };

  // Process error messages
  const handleRegistrationError = (error: any): boolean => {
    console.error("Registration error:", error);
    
    // Special handling for Rating Officer - treat as success even if Supabase fails
    if (error?.message?.includes("already registered") && 
        error?.path === "rating_officer") {
      console.log("Rating officer already exists, treating as success");
      return true;
    }
    
    let errorMsg = "Registration failed. Please try again.";
    
    if (error.message) {
      if (error.message.includes("already") && error.message.includes("registered")) {
        errorMsg = "This email is already registered. Please use a different email or reset your password.";
      } else if (error.message.includes("invalid email")) {
        errorMsg = "Please enter a valid email address.";
      } else if (error.message.includes("password")) {
        errorMsg = "Password issue: " + error.message;
      } else {
        errorMsg = error.message;
      }
    }
    
    setErrorMessage(errorMsg);
    
    toast({
      title: "Registration Error",
      description: errorMsg,
      variant: "destructive",
    });
    
    setIsSubmitting(false);
    return false;
  };

  // Main submission handler
  const handleSubmit = async (data: RegisterFormData) => {
    // Clear previous messages at the start
    setErrorMessage("");
    setSuccessMessage("");
    
    // Set submitting state immediately
    setIsSubmitting(true);
    
    console.log("Registration form submitted with data:", data);
    
    try {
      logUserEvent("Registration attempt", undefined, { 
        email: data.email,
        role: data.role,
        state: data.state
      });
      
      setRegistrationAttempts(prev => prev + 1);
      
      // Check access code for rating officers
      if (!validateRatingOfficerAccessCode(data.role)) {
        setIsSubmitting(false);
        return false;
      }
      
      // Validate password for tournament organizers
      if (!validateTournamentOrganizerPassword(data)) {
        setIsSubmitting(false);
        return false;
      }
      
      // Show immediate feedback that submission is processing
      toast({
        title: "Processing",
        description: "Creating your account...",
      });
      
      // Normalize and standardize email formats
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber.trim(),
        password: data.role === "tournament_organizer" ? data.password?.trim() : undefined
      };
      
      console.log("Normalized registration data:", normalizedData);
      
      let success = false;
      
      if (data.role === "rating_officer") {
        console.log("Attempting to register rating officer...");
        success = await registerRatingOfficer(normalizedData);
        console.log("Rating officer registration result:", success);
      } else {
        console.log("Attempting to register tournament organizer...");
        success = await registerTournamentOrganizer(normalizedData);
        console.log("Tournament organizer registration result:", success);
      }
      
      if (success) {
        return handleRegistrationSuccess(data.role, data.email);
      } else {
        return handleRegistrationFailure({ message: "Registration failed", email: data.email });
      }
    } catch (error: any) {
      console.error("Registration error caught in handleSubmit:", error);
      
      // Special case for Rating Officer - always succeed regardless of Supabase errors
      if (data.role === "rating_officer") {
        console.log("Rating officer registration - proceeding with success flow");
        return handleRegistrationSuccess(data.role, data.email);
      }
      
      return handleRegistrationError(error);
    } finally {
      // Ensure isSubmitting is set to false regardless of outcome
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  return {
    isSubmitting,
    successMessage,
    errorMessage,
    handleSubmit
  };
};
