import { Form } from "@/components/ui/form";
import { useLoginForm } from "@/hooks/useLoginForm";
import RoleSelector from "@/components/login/RoleSelector";
import LoginFormInputs from "@/components/login/LoginFormInputs";
import LoginButton from "@/components/login/LoginButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import React from "react";

interface LoginFormProps {
  setError?: (msg: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ setError }) => {
  const {
    form,
    selectedRole,
    isLoading,
    error,
    showPassword,
    handleRoleChange,
    togglePasswordVisibility,
    onSubmit
  } = useLoginForm(setError);

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Access your Nigeria Chess Rating System account
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <RoleSelector 
            selectedRole={selectedRole} 
            onRoleChange={handleRoleChange}
          />
          
          <input type="hidden" {...form.register("role")} />
          
          <LoginFormInputs
            control={form.control}
            showPassword={showPassword}
            togglePasswordVisibility={togglePasswordVisibility}
            selectedRole={selectedRole}
          />
          
          <LoginButton isLoading={isLoading} />
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
