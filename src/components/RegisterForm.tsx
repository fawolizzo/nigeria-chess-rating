
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Calendar, User, Map, Phone, Mail, Lock, Check, AlertCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { logUserEvent, logMessage, LogLevel } from "@/utils/debugLogger";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { nigerianStates, getAllStates } from "@/lib/nigerianStates";

const RATING_OFFICER_ACCESS_CODE = "NCR2025";

const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(11, "Phone number must be at least 11 digits"),
  state: z.string().min(1, "Please select your state"),
  role: z.enum(["tournament_organizer", "rating_officer"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const navigate = useNavigate();
  const { signUp, isLoading: authLoading } = useSupabaseAuth();
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
    console.log("handleShowAccessCode called with role:", role);
    setShowAccessCode(role === "rating_officer");
    if (role !== "rating_officer") {
      setAccessCode("");
      setIsAccessCodeValid(false);
    }
  };
  
  useEffect(() => {
    console.log("Access code changed to:", accessCode);
    console.log("Expected code:", RATING_OFFICER_ACCESS_CODE);
    const isValid = accessCode === RATING_OFFICER_ACCESS_CODE;
    console.log("Is access code valid?", isValid);
    setIsAccessCodeValid(isValid);
  }, [accessCode]);
  
  const onSubmit = async (data: RegisterFormData) => {
    console.log("Submit function called with data:", data);
    console.log("Current state - isSubmitting:", isSubmitting, "authLoading:", authLoading);
    console.log("Selected role:", data.role);
    console.log("Access code:", accessCode, "isAccessCodeValid:", isAccessCodeValid);
    
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
        console.log("Input code:", accessCode, "Expected code:", RATING_OFFICER_ACCESS_CODE);
        if (accessCode !== RATING_OFFICER_ACCESS_CODE) {
          console.error("Access code validation failed. Input:", accessCode, "Expected:", RATING_OFFICER_ACCESS_CODE);
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
      
      console.log("Calling signUp with metadata:", metadata);
      console.log("Before Supabase signUp call");
      const success = await signUp(normalizedData.email, normalizedData.password, metadata);
      console.log("After Supabase signUp call. Result:", success);
      
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
      // Add detailed console logging of the error
      console.error("DETAILED REGISTRATION ERROR:", error);
      console.error("Error object type:", typeof error);
      console.error("Error properties:", Object.keys(error));
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      console.error("Error stack:", error.stack);
      
      // If error is an object with a code and message property (Supabase format)
      if (error.code) {
        console.error("Supabase Error Code:", error.code);
      }
      
      // If error is an object with a response property (HTTP error)
      if (error.response) {
        console.error("API Response Error:", error.response);
      }
      
      logUserEvent("Registration error", undefined, { 
        error: error.message, 
        errorCode: error.code,
        errorName: error.name
      });
      
      // Show a more descriptive error message if available
      const errorMsg = error.message || "Registration failed. Please try again.";
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
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div
              className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
                selectedRole === "tournament_organizer"
                  ? "border-nigeria-green bg-nigeria-green/5"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => {
                form.setValue("role", "tournament_organizer");
                handleShowAccessCode("tournament_organizer");
              }}
            >
              <Calendar className={`h-6 w-6 mb-2 ${
                selectedRole === "tournament_organizer"
                  ? "text-nigeria-green dark:text-nigeria-green-light"
                  : "text-gray-500 dark:text-gray-400"
              }`} />
              <h3 className={`text-sm font-medium ${
                selectedRole === "tournament_organizer"
                  ? "text-nigeria-green-dark dark:text-nigeria-green-light"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                Tournament Organizer
              </h3>
            </div>
            
            <div
              className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
                selectedRole === "rating_officer"
                  ? "border-nigeria-green bg-nigeria-green/5"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => {
                form.setValue("role", "rating_officer");
                handleShowAccessCode("rating_officer");
              }}
            >
              <Shield className={`h-6 w-6 mb-2 ${
                selectedRole === "rating_officer"
                  ? "text-nigeria-green dark:text-nigeria-green-light"
                  : "text-gray-500 dark:text-gray-400"
              }`} />
              <h3 className={`text-sm font-medium ${
                selectedRole === "rating_officer"
                  ? "text-nigeria-green-dark dark:text-nigeria-green-light"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                Rating Officer
              </h3>
            </div>
          </div>
          
          <input type="hidden" {...form.register("role")} />
          
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Enter your full name" 
                      className="pl-10" 
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
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
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Enter your phone number" 
                      className="pl-10" 
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <div className="relative">
                      <Map className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                    </div>
                  </FormControl>
                  <SelectContent className="max-h-[200px]">
                    {getAllStates().map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Create a password" 
                      className="pl-10" 
                      type="password"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Confirm your password" 
                      className="pl-10" 
                      type="password"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {showAccessCode && (
            <div>
              <FormLabel>Access Code</FormLabel>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Enter Rating Officer access code" 
                  className={`pl-10 ${isAccessCodeValid ? 'border-green-500 focus:ring-green-500' : ''}`}
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Required for Rating Officer registration
                </p>
                {isAccessCodeValid && (
                  <p className="text-xs text-green-500 flex items-center">
                    <Check className="h-3 w-3 mr-1" /> Code valid - account will be auto-approved
                  </p>
                )}
              </div>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full bg-nigeria-green hover:bg-nigeria-green-dark text-white"
            disabled={isSubmitting || authLoading || (showAccessCode && !isAccessCodeValid)}
          >
            {isSubmitting || authLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
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
    </div>
  );
};

export default RegisterForm;
