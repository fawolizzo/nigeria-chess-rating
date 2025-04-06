
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { logUserEvent, LogLevel, logMessage } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import type { RegisterFormData } from "@/components/register/RegisterFormSchema";

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

  const handleSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      logUserEvent("Registration attempt", undefined, { 
        email: data.email,
        role: data.role,
        state: data.state
      });
      
      setRegistrationAttempts(prev => prev + 1);
      
      // Check access code for rating officers
      if (data.role === "rating_officer") {
        if (accessCode !== RATING_OFFICER_ACCESS_CODE) {
          setErrorMessage("Invalid access code for Rating Officer registration");
          toast({
            title: "Invalid Access Code",
            description: "Please enter a valid access code for Rating Officer registration",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return false;
        }
      }
      
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber.trim(),
        password: data.role === "tournament_organizer" ? data.password?.trim() : undefined
      };
      
      let success = false;
      
      if (data.role === "rating_officer") {
        logMessage(LogLevel.INFO, 'RegistrationSubmit', `Attempting to register rating officer: ${normalizedData.email}`);
        
        try {
          // Register rating officer in local system without password
          success = await registerInLocalSystem({
            fullName: normalizedData.fullName,
            email: normalizedData.email,
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
        } catch (error) {
          console.error("Error registering rating officer:", error);
          logMessage(LogLevel.ERROR, 'RegistrationSubmit', `Error registering rating officer: ${normalizedData.email}`, error);
          throw error;
        }
      } else {
        // For tournament organizers, both password and confirmPassword must be provided
        if (!normalizedData.password) {
          setErrorMessage("Password is required for Tournament Organizer registration");
          toast({
            title: "Password Required",
            description: "Please enter a password for your Tournament Organizer account",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return false;
        }
        
        // Register tournament organizer in Supabase and local system
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
            status: "pending" as const,
            password: normalizedData.password
          });
          
          success = true;
        } catch (error) {
          console.error("Registration error:", error);
          throw error;
        }
      }
      
      if (success) {
        setSuccessMessage(
          data.role === "tournament_organizer"
            ? "Registration successful! Your account is pending approval by a rating officer."
            : "Rating Officer account created successfully! You can now log in."
        );
        
        toast({
          title: "Registration successful!",
          description: data.role === "rating_officer" 
            ? "Your Rating Officer account has been created. You can now log in."
            : "Your account has been created. A rating officer will review and approve your account.",
          variant: "default"
        });
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        
        return true;
      } else {
        setErrorMessage("Registration failed. Please try again with a different email address.");
        
        toast({
          title: "Registration Failed",
          description: "There was an issue with your registration. Please try again with a different email.",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
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
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    successMessage,
    errorMessage,
    handleSubmit
  };
};
