
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/components/register/RegisterFormSchema";
import { useAccessCode } from "./useAccessCode";
import { useRegistrationSubmit } from "./useRegistrationSubmit";
import type { RegisterFormData } from "@/components/register/RegisterFormSchema";

export const useRegisterForm = () => {
  const {
    showAccessCode,
    accessCode,
    isAccessCodeValid,
    handleShowAccessCode,
    setAccessCode,
    RATING_OFFICER_ACCESS_CODE
  } = useAccessCode();
  
  const {
    isSubmitting,
    successMessage,
    errorMessage,
    handleSubmit
  } = useRegistrationSubmit(accessCode, isAccessCodeValid, RATING_OFFICER_ACCESS_CODE);
  
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
  
  const onSubmit = async (data: RegisterFormData) => {
    console.log("Form submitted with data:", data);
    console.log("AccessCode state:", {
      showAccessCode,
      accessCode,
      isAccessCodeValid,
      selectedRole
    });
    
    // For rating officers, ensure the access code is valid
    if (data.role === "rating_officer" && !isAccessCodeValid) {
      console.log("Preventing submission due to invalid access code");
      return false;
    }
    
    return handleSubmit(data);
  };

  // Only disable the submit button when actually submitting or when access code is invalid and entered
  const isSubmitDisabled = isSubmitting || (showAccessCode && !isAccessCodeValid && accessCode.length > 0);

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
