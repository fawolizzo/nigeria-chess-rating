
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  UserPlus, 
  Shield, 
  Calendar, 
  User, 
  Map, 
  Phone, 
  Mail, 
  Lock, 
  Check, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/components/Navbar";
import { useUser } from "@/contexts/UserContext";
import { toast } from "@/components/ui/use-toast";
import { 
  syncStorage, 
  ensureDeviceId, 
  clearAllData as clearStorageData,
  forceSyncAllStorage
} from "@/utils/storageUtils";
import { logUserEvent } from "@/utils/debugLogger";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", 
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
];

// Fixed access code - should be moved to environment variables in production
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

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, refreshUserData, forceSync } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isAccessCodeValid, setIsAccessCodeValid] = useState(false);
  const [registrationAttempts, setRegistrationAttempts] = useState(0);
  
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
  
  useEffect(() => {
    const initializeRegistration = async () => {
      try {
        ensureDeviceId();
        await forceSyncAllStorage(['ncr_users']);
        await refreshUserData();
        await forceSync();
        
        logUserEvent("Register page initialized successfully");
      } catch (error) {
        console.error("Error initializing register page:", error);
        logUserEvent("Register page initialization error", undefined, error);
      }
    };
    
    initializeRegistration();
  }, [refreshUserData, forceSync]);
  
  const selectedRole = form.watch("role");
  
  useEffect(() => {
    setIsAccessCodeValid(accessCode === RATING_OFFICER_ACCESS_CODE);
  }, [accessCode]);
  
  const handleShowAccessCode = (role: string) => {
    setShowAccessCode(role === "rating_officer");
    if (role !== "rating_officer") {
      setAccessCode("");
      setIsAccessCodeValid(false);
    }
  };
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      logUserEvent("Registration attempt", undefined, { 
        email: data.email,
        role: data.role,
        state: data.state,
        attempts: registrationAttempts + 1
      });
      
      setRegistrationAttempts(prev => prev + 1);
      
      // Force sync to ensure we have the latest data
      await forceSyncAllStorage(['ncr_users']);
      
      if (data.role === "rating_officer") {
        if (accessCode !== RATING_OFFICER_ACCESS_CODE) {
          logUserEvent("Invalid rating officer access code", undefined, { email: data.email });
          setErrorMessage("Invalid access code for Rating Officer registration");
          setIsSubmitting(false);
          
          toast({
            title: "Invalid Access Code",
            description: "Please enter a valid access code for Rating Officer registration",
            variant: "destructive"
          });
          
          return;
        }
        
        logUserEvent("Valid rating officer access code provided", undefined, { email: data.email });
      }
      
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber.trim()
      };
      
      const isAutoApproved = data.role === "rating_officer" && isAccessCodeValid;
      
      const userData = {
        fullName: normalizedData.fullName,
        email: normalizedData.email,
        phoneNumber: normalizedData.phoneNumber,
        state: normalizedData.state,
        role: normalizedData.role as 'tournament_organizer' | 'rating_officer',
        password: normalizedData.password,
        status: isAutoApproved ? 'approved' as const : 'pending' as const
      };
      
      const success = await registerUser(userData);
      
      if (success) {
        logUserEvent("Registration successful", undefined, { 
          email: data.email, 
          role: data.role,
          autoApproved: isAutoApproved
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
            : "A confirmation email has been sent to your email address.",
        });
        
        form.reset();
        setAccessCode("");
        setIsAccessCodeValid(false);
        
        // Force sync to ensure data is available across devices
        await forceSyncAllStorage(['ncr_users']);
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        logUserEvent("Registration failed", undefined, { email: data.email, role: data.role });
        setErrorMessage("Registration failed. Please try again with a different email address.");
        
        toast({
          title: "Registration Failed",
          description: "There was an issue with your registration. Please try again with a different email.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      logUserEvent("Registration error", undefined, { error: error.message });
      
      setErrorMessage(error.message || "Registration failed. Please try again.");
      
      toast({
        title: "Registration Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
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
                          {nigerianStates.map((state) => (
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
                  disabled={isSubmitting || (showAccessCode && !isAccessCodeValid)}
                >
                  {isSubmitting ? (
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
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-nigeria-green dark:text-nigeria-green-light hover:underline">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
