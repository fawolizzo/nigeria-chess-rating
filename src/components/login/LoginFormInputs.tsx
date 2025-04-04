
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage 
} from "@/components/ui/form";
import { Control } from "react-hook-form";
import { z } from "zod";

// Schema for login form
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password or access code is required"),
  role: z.enum(["tournament_organizer", "rating_officer"])
});

export type LoginFormData = z.infer<typeof loginSchema>;

type LoginFormInputsProps = {
  control: Control<LoginFormData>;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  selectedRole: "tournament_organizer" | "rating_officer";
};

const LoginFormInputs = ({
  control,
  showPassword,
  togglePasswordVisibility,
  selectedRole
}: LoginFormInputsProps) => {
  // Get the appropriate label for the password field based on role
  const passwordLabel = selectedRole === "rating_officer" 
    ? "Password or Access Code" 
    : "Password";

  const passwordPlaceholder = selectedRole === "rating_officer"
    ? "Enter your password or access code"
    : "Enter your password";

  return (
    <>
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Enter your email address" 
                  className="pl-10" 
                  type="email"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{passwordLabel}</FormLabel>
            <FormControl>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder={passwordPlaceholder}
                  className="pl-10 pr-10" 
                  type={showPassword ? "text" : "password"}
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 px-3 text-gray-400 hover:text-gray-500"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default LoginFormInputs;
