
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
  RefreshCw,
  Loader2,
  WifiOff
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
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { requestDataSync, syncAuthData } from "@/utils/deviceSync";

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
  const { register: registerUser, getRatingOfficerEmails, forceSync } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'initializing' | 'syncing' | 'success' | 'failed' | 'retrying'>('initializing');
  const [syncRetries, setSyncRetries] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("[Register] Device came online");
      setIsOnline(true);
      
      // Retry sync when device comes back online
      if (syncStatus === 'failed' || syncStatus === 'retrying') {
        handleManualSync();
      }
    };
    
    const handleOffline = () => {
      console.log("[Register] Device went offline");
      setIsOnline(false);
      
      if (syncStatus === 'syncing') {
        setSyncStatus('failed');
        setErrorMessage("Synchronization failed: You are offline. Please reconnect to the internet and try again.");
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus]);
  
  useEffect(() => {
    const initialSync = async () => {
      setIsSyncing(true);
      setIsInitializing(true);
      setSyncStatus('initializing');
      
      if (!isOnline) {
        console.warn("[Register] Device is offline, cannot sync");
        setSyncStatus('failed');
        setErrorMessage("Cannot initialize registration system: You are offline. Please connect to the internet.");
        setIsSyncing(false);
        setIsInitializing(false);
        return;
      }
      
      try {
        console.log("[Register] Starting initial synchronization process");
        setSyncStatus('syncing');
        
        // Request sync from other devices
        const syncRequestResult = await requestDataSync();
        console.log("[Register] Sync request result:", syncRequestResult);
        
        // Wait for sync to complete with progressive timeouts
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Force sync to ensure latest data
        const forceSyncResult = await forceSync();
        console.log("[Register] Force sync result:", forceSyncResult);
        
        if (forceSyncResult) {
          console.log("[Register] Initial data sync completed successfully");
          setSyncStatus('success');
          toast({
            title: "Synchronization Complete",
            description: "Your device has been synchronized with the system.",
          });
        } else {
          console.warn("[Register] Initial sync completed with warnings");
          setSyncStatus('success'); // Still consider it a success to allow registration
          toast({
            title: "Synchronization Warning",
            description: "Synchronization completed with warnings. Some features may be limited.",
            variant: "warning"
          });
        }
        
        console.log("[Register] Initial data sync process finished");
      } catch (error) {
        console.error("[Register] Error during initial sync:", error);
        
        setSyncStatus('failed');
        setErrorMessage("Failed to synchronize with the system. Please try refreshing the page.");
        
        toast({
          title: "Sync Error",
          description: "There was an error synchronizing with other devices. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSyncing(false);
        setIsInitializing(false);
      }
    };
    
    initialSync();
  }, [forceSync]);
  
  const selectedRole = form.watch("role");
  
  const handleShowAccessCode = (role: string) => {
    setShowAccessCode(role === "rating_officer");
  };
  
  const handleManualSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setErrorMessage("");
    setSyncStatus('syncing');
    setSyncRetries(prev => prev + 1);
    
    if (!isOnline) {
      console.warn("[Register] Cannot sync while offline");
      setSyncStatus('failed');
      setErrorMessage("Cannot synchronize: You are offline. Please connect to the internet.");
      setIsSyncing(false);
      return;
    }
    
    try {
      console.log("[Register] Starting manual synchronization");
      
      // First request sync from other devices
      const syncRequestResult = await requestDataSync();
      console.log("[Register] Sync request result:", syncRequestResult);
      
      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force sync to ensure latest data
      const forceSyncResult = await forceSync();
      console.log("[Register] Force sync result:", forceSyncResult);
      
      if (forceSyncResult) {
        console.log("[Register] Manual sync completed successfully");
        setSyncStatus('success');
        
        toast({
          title: "Data Synchronized",
          description: "Your device has been synchronized with the latest data.",
        });
      } else {
        console.warn("[Register] Manual sync completed with warnings");
        setSyncStatus('success'); // Still consider it a success
        
        toast({
          title: "Synchronization Warning",
          description: "Synchronization completed with warnings. Some features may be limited.",
          variant: "warning"
        });
      }
    } catch (error) {
      console.error("[Register] Error during manual sync:", error);
      
      setSyncStatus('retrying');
      setErrorMessage("Synchronization failed. Please try again or refresh the page.");
      
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    
    if (syncStatus === 'failed') {
      console.warn("[Register] Cannot register while sync has failed");
      setErrorMessage("Cannot register: System synchronization has failed. Please try again after syncing.");
      setIsSubmitting(false);
      return;
    }
    
    if (!isOnline) {
      console.warn("[Register] Cannot register while offline");
      setErrorMessage("Cannot register: You are offline. Please connect to the internet.");
      setIsSubmitting(false);
      return;
    }
    
    try {
      console.log("[Register] Starting registration process");
      
      // Force sync before registration to ensure we have latest user data
      console.log("[Register] Syncing before registration");
      const preSyncResult = await forceSync();
      
      if (!preSyncResult) {
        console.warn("[Register] Pre-registration sync warning");
        toast({
          title: "Sync Warning",
          description: "Could not fully synchronize before registration. Proceeding anyway.",
          variant: "warning"
        });
      }
      
      if (data.role === "rating_officer" && accessCode !== "NCR2025") {
        console.warn("[Register] Invalid rating officer access code");
        setErrorMessage("Invalid access code for Rating Officer registration");
        setIsSubmitting(false);
        return;
      }
      
      // Normalize data
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber.trim()
      };
      
      console.log("[Register] Sending registration data");
      const success = await registerUser({
        fullName: normalizedData.fullName,
        email: normalizedData.email,
        phoneNumber: normalizedData.phoneNumber,
        state: normalizedData.state,
        role: normalizedData.role as 'tournament_organizer' | 'rating_officer',
        password: normalizedData.password
      });
      
      if (success) {
        console.log("[Register] Registration successful");
        
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
        
        // Force another sync to ensure data propagates to other devices
        console.log("[Register] Syncing after registration");
        await syncAuthData(true);
        await forceSync();
        
        setTimeout(() => {
          console.log("[Register] Redirecting to login");
          navigate("/login");
        }, 3000);
      } else {
        console.error("[Register] Registration failed");
        setErrorMessage("Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("[Register] Registration error:", error);
      setErrorMessage(error.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-nigeria-green mb-4" />
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
            {syncStatus === 'initializing' ? 'Initializing Registration System' : 
             syncStatus === 'syncing' ? 'Synchronizing with other devices...' :
             syncStatus === 'failed' ? 'Synchronization Failed' : 
             'Completing Initialization'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            {syncStatus === 'initializing' ? 'Preparing the registration system...' : 
             syncStatus === 'syncing' ? 'Ensuring your data is up-to-date across all devices...' :
             syncStatus === 'failed' ? 'There was a problem connecting to the system.' : 
             'Almost ready...'}
          </p>

          {syncStatus === 'failed' && (
            <div className="mt-6">
              <Button 
                variant="default" 
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="mx-auto"
              >
                {isSyncing ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Trying Again...</>
                ) : !isOnline ? (
                  <><WifiOff className="h-4 w-4 mr-2" /> You're Offline</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" /> Try Again</>
                )}
              </Button>
              {!isOnline && (
                <p className="text-sm text-center mt-2 text-amber-600 dark:text-amber-400">
                  Please connect to the internet and try again
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular render with form
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
              
              <div className="mt-2 flex justify-center items-center space-x-2">
                <SyncStatusIndicator showButton={true} />
                
                {syncStatus === 'retrying' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2 h-7 text-xs"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Syncing..." : "Retry Sync"}
                  </Button>
                )}
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
                  {(errorMessage.includes("Email has already registered") || 
                    errorMessage.includes("synchronization") || 
                    errorMessage.includes("sync")) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 h-8 text-xs"
                      onClick={handleManualSync}
                      disabled={isSyncing || !isOnline}
                    >
                      {!isOnline ? (
                        <><WifiOff className="h-3 w-3 mr-1" /> You're Offline</>
                      ) : (
                        <><RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? "Syncing..." : "Sync Data & Try Again"}</>
                      )}
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
                    disabled={isSubmitting || isSyncing || syncStatus === 'failed' || !isOnline}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Registering...
                      </span>
                    ) : !isOnline ? (
                      <span className="flex items-center">
                        <WifiOff className="h-4 w-4 mr-2" />
                        You're Offline
                      </span>
                    ) : syncStatus === 'failed' ? (
                      <span className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Sync Required
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
