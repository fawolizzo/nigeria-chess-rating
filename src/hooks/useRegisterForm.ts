
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { logUserEvent } from "@/utils/debugLogger";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useUser } from "@/contexts/UserContext";
import { registerSchema } from "@/components/register/RegisterFormSchema";
import { supabase } from "@/integrations/supabase/client";
import type { RegisterFormData } from "@/components/register/RegisterFormSchema";

const RATING_OFFICER_ACCESS_CODE = "NCR2025";

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const { signUp, isLoading: authLoading } = useSupabaseAuth();
  const { register: registerInLocalSystem } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isAccessCodeValid, setIsAccessCodeValid] = useState(false);
  const [registrationAttempts, setRegistrationAttempts] = useState(0);
  const { toast } = useToast();
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      state: "",
      role: "tournament_organizer",
      password: "",
      confirmPassword: ""
    }
  });
  
  const selectedRole = form.watch("role");
  
  const handleShowAccessCode = (role: string) => {
    setShowAccessCode(role === "rating_officer");
    if (role !== "rating_officer") {
      setAccessCode("");
      setIsAccessCodeValid(false);
    }
  };
  
  useEffect(() => {
    const isValid = accessCode === RATING_OFFICER_ACCESS_CODE;
    setIsAccessCodeValid(isValid);
  }, [accessCode]);

  const onSubmit = async (data: RegisterFormData) => {
    console.log("==== REGISTRATION FORM SUBMISSION DEBUG ====");
    console.log("Submit function called with data:", JSON.stringify(data, null, 2));
    
    if (isSubmitting || authLoading) {
      console.log("Submission already in progress, returning early");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      console.log("Starting registration process");
      logUserEvent("Registration attempt", undefined, { 
        email: data.email,
        role: data.role,
        state: data.state,
        attempts: registrationAttempts + 1
      });
      
      setRegistrationAttempts(prev => prev + 1);
      
      if (data.role === "rating_officer") {
        console.log("Verifying Rating Officer access code");
        
        if (accessCode !== RATING_OFFICER_ACCESS_CODE) {
          console.error("Access code validation failed");
          logUserEvent("Invalid rating officer access code", undefined, { email: data.email });
          setErrorMessage("Invalid access code for Rating Officer registration");
          
          toast({
            title: "Invalid Access Code",
            description: "Please enter a valid access code for Rating Officer registration",
            variant: "destructive"
          });
          
          setIsSubmitting(false);
          return;
        }
        
        console.log("Rating Officer access code validated successfully");
        logUserEvent("Valid rating officer access code provided", undefined, { email: data.email });
      }
      
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber.trim(),
        password: data.password.trim()
      };
      
      const metadata = {
        fullName: normalizedData.fullName,
        phoneNumber: normalizedData.phoneNumber,
        state: normalizedData.state,
        role: normalizedData.role,
        status: normalizedData.role === 'rating_officer' ? 'approved' : 'pending'
      };
      
      console.log("Registration metadata prepared:", JSON.stringify(metadata, null, 2));
      
      let success = false;
      
      if (data.role === "rating_officer") {
        try {
          console.log("Registering Rating Officer in local system");
          success = await registerInLocalSystem({
            fullName: normalizedData.fullName,
            email: normalizedData.email,
            phoneNumber: normalizedData.phoneNumber,
            state: normalizedData.state,
            role: "rating_officer" as const,
            status: "approved" as const,
            password: normalizedData.password
          });
          
          console.log("Local system registration result:", success);
          
          if (success) {
            try {
              console.log("Attempting backup registration in Supabase for Rating Officer");
              await signUp(normalizedData.email, normalizedData.password, metadata);
              console.log("Supabase backup registration complete");
            } catch (supabaseError) {
              console.error("Supabase backup registration failed, but local registration succeeded:", supabaseError);
              // Log but ignore Supabase errors for Rating Officers
            }
          }
        } catch (localError) {
          console.error("Local system registration error:", localError);
          throw localError;
        }
      } else {
        console.log("Registering Tournament Organizer in Supabase");
        
        try {
          const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
            email: normalizedData.email,
            password: normalizedData.password,
            options: {
              data: metadata
            }
          });
          
          if (supabaseError) {
            console.error("DETAILED SUPABASE ERROR:", supabaseError);
            throw supabaseError;
          }
          
          console.log("Supabase signUp response data:", supabaseData);
          
          if (!supabaseData.user) {
            console.error("No user returned from signUp call!");
            throw new Error("Registration failed - no user data returned");
          }
          
          success = true;
          console.log("Supabase registration completed successfully");
          
        } catch (directError) {
          console.error("DIRECT SUPABASE ERROR CAUGHT:", directError);
          throw directError;
        }
      }
      
      if (success) {
        console.log("Registration successful");
        logUserEvent("Registration successful", undefined, { 
          email: data.email, 
          role: data.role,
          autoApproved: data.role === 'rating_officer'
        });
        
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
        });
        
        form.reset();
        setAccessCode("");
        setIsAccessCodeValid(false);
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        console.error("Registration failed with no specific error returned");
        logUserEvent("Registration failed", undefined, { email: data.email, role: data.role });
        setErrorMessage("Registration failed. Please try again with a different email address.");
        
        toast({
          title: "Registration Failed",
          description: "There was an issue with your registration. Please try again with a different email.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("DETAILED REGISTRATION ERROR:", error);
      
      logUserEvent("Registration error", undefined, { 
        error: error.message, 
        errorCode: error.code,
        errorName: error.name
      });
      
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
    } finally {
      console.log("Registration attempt completed");
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || authLoading || (showAccessCode && !isAccessCodeValid);

  return {
    form,
    selectedRole,
    isSubmitting,
    successMessage,
    errorMessage,
    showAccessCode,
    accessCode,
    isAccessCodeValid,
    isSubmitDisabled,
    handleShowAccessCode,
    setAccessCode,
    onSubmit
  };
};
