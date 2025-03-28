import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ClipboardCheck, 
  UserPlus, 
  Shield, 
  Calendar, 
  ChevronDown, 
  User, 
  Map, 
  Phone, 
  Mail, 
  Lock, 
  Check, 
  AlertCircle,
  RefreshCw
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
import { forceSyncAllStorage } from "@/utils/storageUtils";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", 
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
];

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
  const { register: registerUser, getRatingOfficerEmails } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  
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
    const initialSync = async () => {
      setIsSyncing(true);
      try {
        await forceSyncAllStorage();
        console.log("Initial data sync completed");
      } catch (error) {
        console.error("Error during initial sync:", error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    initialSync();
  }, []);
  
  const selectedRole = form.watch("role");
  
  const handleShowAccessCode = (role: string) => {
    setShowAccessCode(role === "rating_officer");
  };
  
  const handleManualSync = async () => {
    setIsSyncing(true);
    setErrorMessage("");
    
    try {
      await forceSyncAllStorage();
      toast({
        title: "Data Synchronized",
        description: "Your device has been synchronized with the latest data.",
      });
    } catch (error) {
      console.error("Error during manual sync:", error);
      setErrorMessage("Failed to synchronize data. Please try again before registering.");
    } finally {
      setIsSyncing(false);
    }
  };
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      await forceSyncAllStorage();
    } catch (syncError) {
      console.error("Error syncing before registration:", syncError);
    }
    
    if (data.role === "rating_officer" && accessCode !== "NCR2025") {
      setErrorMessage("Invalid access code for Rating Officer registration");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim()
      };
      
      try {
        const storedUsers = localStorage.getItem('ncr_users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const filteredUsers = users.filter((user: any) => 
            user.email.toLowerCase() !== normalizedData.email.toLowerCase()
          );
          localStorage.setItem('ncr_users', JSON.stringify(filteredUsers));
        }
      } catch (storageError) {
        console.error("Error cleaning up storage:", storageError);
      }
      
      const success = await registerUser({
        fullName: normalizedData.fullName,
        email: normalizedData.email,
        phoneNumber: normalizedData.phoneNumber,
        state: normalizedData.state,
        role: normalizedData.role as 'tournament_organizer' | 'rating_officer',
        password: normalizedData.password
      });
      
      if (success) {
        if (data.role === "tournament_organizer") {
          setSuccessMessage("Registration successful! Your account is pending approval by a rating officer.");
          toast({
            title: "Registration successful!",
            description: "A confirmation email has been sent to your email address.",
          });

          const ratingOfficerEmails = getRatingOfficerEmails();
          if (ratingOfficerEmails.length > 0) {
            toast({
              title: "Rating officers notified",
              description: "Rating officers have been notified about your registration.",
              variant: "default",
            });
          }
        } else {
          setSuccessMessage("Rating Officer account created successfully!");
        }
        
        form.reset();
        setAccessCode("");
        
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Registration failed");
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
              
              <div className="mt-2 flex justify-center">
                <SyncStatusIndicator showButton={true} />
              </div>
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
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                  {errorMessage.includes("Email has already registered") && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 h-8 text-xs"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? "Syncing..." : "Sync Data & Try Again"}
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div
                    className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
                      selectedRole === "tournament_organizer"
                        ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => {
                      form.setValue("role", "tournament_organizer");
                      handleShowAccessCode("tournament_organizer");
                    }}
                  >
                    <Calendar className={`h-6 w-6 mb-2 ${
                      selectedRole === "tournament_organizer"
                        ? "text-black dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`} />
                    <h3 className={`text-sm font-medium ${
                      selectedRole === "tournament_organizer"
                        ? "text-black dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      Tournament Organizer
                    </h3>
                  </div>
                  
                  <div
                    className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
                      selectedRole === "rating_officer"
                        ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => {
                      form.setValue("role", "rating_officer");
                      handleShowAccessCode("rating_officer");
                    }}
                  >
                    <Shield className={`h-6 w-6 mb-2 ${
                      selectedRole === "rating_officer"
                        ? "text-black dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`} />
                    <h3 className={`text-sm font-medium ${
                      selectedRole === "rating_officer"
                        ? "text-black dark:text-white"
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
                            <Map className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select your state" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent>
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
                
                {showAccessCode && (
                  <div className="space-y-2">
                    <label htmlFor="accessCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Access Code
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="accessCode"
                        type="password"
                        placeholder="Enter rating officer access code"
                        className="pl-10"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Rating Officer registration requires an access code.
                      Please contact the Nigerian Chess Federation to obtain one.
                    </p>
                  </div>
                )}
                
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
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || isSyncing}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <ClipboardCheck className="animate-spin h-4 w-4 mr-2" />
                        Registering...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register Account
                      </span>
                    )}
                  </Button>
                </div>
                
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                      Log in
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
