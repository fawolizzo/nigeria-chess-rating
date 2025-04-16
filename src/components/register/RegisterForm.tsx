
import { UserPlus, Loader2, Check, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import RoleSelector from "./RoleSelector";
import RegisterFormFields from "./RegisterFormFields";
import AccessCodeInput from "./AccessCodeInput";
import RegistrationDebug from "./RegistrationDebug";
import { useRegisterForm } from "@/hooks/registration/useRegisterForm";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

const RegisterForm = () => {
  const {
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
  } = useRegisterForm();
  
  const [submitProgress, setSubmitProgress] = useState(0);
  
  // Update progress bar when submitting
  useEffect(() => {
    if (isSubmitting) {
      // Reset progress when starting submission
      setSubmitProgress(0);
      
      // Simulate progress
      const interval = setInterval(() => {
        setSubmitProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      return () => {
        clearInterval(interval);
        // Complete progress when done
        setSubmitProgress(100);
      };
    }
  }, [isSubmitting]);
  
  // Show successful completion
  useEffect(() => {
    if (successMessage) {
      setSubmitProgress(100);
    }
  }, [successMessage]);
  
  console.log("RegisterForm rendered with state:", {
    selectedRole,
    isSubmitting,
    successMessage,
    errorMessage,
    showAccessCode,
    accessCode,
    isAccessCodeValid,
    isSubmitDisabled
  });
  
  const handleFormSubmit = async (data: any) => {
    console.log("Form submitted with values:", data);
    console.log("Selected role:", selectedRole);
    console.log("Access code (rating officer):", accessCode);
    console.log("Is access code valid:", isAccessCodeValid);
    
    try {
      return await onSubmit(data);
    } catch (error) {
      console.error("Error during form submission:", error);
      return false;
    }
  };
  
  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Register Account</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Join the Nigeria Chess Rating System
        </p>
      </div>
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start">
          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="ml-3 text-sm text-green-700 dark:text-green-300">{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="ml-3 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
      )}
      
      {isSubmitting && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Creating your account...</p>
          <Progress value={submitProgress} className="h-2" />
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-5">
          <RoleSelector 
            selectedRole={selectedRole} 
            onRoleSelect={(role) => {
              console.log("Role selected:", role);
              form.setValue("role", role);
              handleShowAccessCode(role);
            }} 
          />
          
          <input type="hidden" {...form.register("role")} />
          
          <RegisterFormFields form={form} />
          
          {showAccessCode && (
            <>
              <AccessCodeInput 
                accessCode={accessCode}
                isAccessCodeValid={isAccessCodeValid}
                onChange={(value) => {
                  console.log("Access code changed:", value);
                  setAccessCode(value);
                }}
              />
              
              {!isAccessCodeValid && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md flex items-start">
                  <Info className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="ml-3 text-sm text-amber-700 dark:text-amber-300">
                    To create a Rating Officer account, you must enter the valid access code: <strong>RNCR25</strong>
                  </p>
                </div>
              )}
            </>
          )}
          
          <Button
            type="submit"
            className="w-full bg-nigeria-green hover:bg-nigeria-green-dark text-white transition-all"
            disabled={isSubmitDisabled}
            aria-label={isSubmitting ? "Creating Account..." : "Create Account"}
            data-testid="register-button"
            onClick={() => {
              console.log("Submit button clicked");
              console.log("Form values:", form.getValues());
              console.log("Form state:", form.formState);
              console.log("Button disabled state:", isSubmitDisabled);
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>
      </Form>
      
      {process.env.NODE_ENV !== 'production' && <RegistrationDebug />}
    </div>
  );
};

export default RegisterForm;
