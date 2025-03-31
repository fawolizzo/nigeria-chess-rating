
import { Form } from "@/components/ui/form";
import { useLoginForm } from "@/hooks/useLoginForm";
import RoleSelector from "@/components/login/RoleSelector";
import LoginFormInputs from "@/components/login/LoginFormInputs";
import LoginButton from "@/components/login/LoginButton";

const LoginForm = () => {
  const {
    form,
    selectedRole,
    isLoading,
    error,
    showPassword,
    handleRoleChange,
    togglePasswordVisibility,
    onSubmit
  } = useLoginForm();

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Access your Nigeria Chess Rating System account
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
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
