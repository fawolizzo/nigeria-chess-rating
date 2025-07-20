import { useState } from 'react';
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUser } from '@/contexts/UserContext';
import { useSupabaseAuth } from '@/services/auth/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logMessage, LogLevel } from '@/utils/debugLogger';

interface ResetSystemDataProps {
  onReset?: () => void;
}

const ResetSystemData: React.FC<ResetSystemDataProps> = ({ onReset }) => {
  const { clearAllData } = useUser();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);

    try {
      console.log('Starting system data reset...');
      logMessage(
        LogLevel.WARNING,
        'ResetSystemData',
        'User initiated system reset'
      );

      // Store the current user's email if available (for potential deletion)
      const currentUserEmail = user?.email;

      // Step 1: Sign out the current user from Supabase
      console.log('Signing out current user from Supabase...');
      await supabase.auth.signOut();
      console.log('User signed out successfully');

      // Step 2: Clear all local data
      console.log('Clearing all local data...');
      const success = await clearAllData();

      if (success) {
        console.log('Local data cleared successfully');
      } else {
        console.error('Error clearing local data');
      }

      // Step 3: If we have the current user's email and it's a test account, attempt to delete it
      if (
        currentUserEmail &&
        (currentUserEmail.includes('test') ||
          currentUserEmail.includes('demo') ||
          window.confirm(
            `Do you want to delete the Supabase auth user "${currentUserEmail}"? This will allow you to reuse this email for testing.`
          ))
      ) {
        console.log(
          `Attempting to delete Supabase auth user: ${currentUserEmail}`
        );

        try {
          // Call the edge function to delete the user
          const { data, error } = await supabase.functions.invoke(
            'delete-auth-user',
            {
              body: { email: currentUserEmail },
            }
          );

          if (error) {
            console.error('Error deleting auth user:', error);
            toast({
              title: 'Auth User Deletion Failed',
              description: `Could not delete auth user: ${error.message}`,
              variant: 'destructive',
            });
          } else {
            console.log('Auth user deletion response:', data);
            if (data.success) {
              toast({
                title: 'Auth User Deleted',
                description: data.message,
              });
            } else {
              toast({
                title: 'Auth User Deletion Issue',
                description: data.message || 'Unknown issue occurred',
                variant: 'destructive',
              });
            }
          }
        } catch (fnError) {
          console.error('Edge function error:', fnError);
          toast({
            title: 'Auth User Deletion Failed',
            description: 'Edge function error. Check console for details.',
            variant: 'destructive',
          });
        }
      }

      // Step 4: Show successful reset toast
      toast({
        title: 'System Reset Complete',
        description:
          'All system data has been cleared. You will be redirected to the homepage.',
      });

      // Call onReset callback if provided
      if (onReset) {
        onReset();
      }

      // Reload the page after a small delay to ensure storage events are processed
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Error during system reset:', error);
      logMessage(
        LogLevel.ERROR,
        'ResetSystemData',
        'System reset failed',
        error
      );

      toast({
        title: 'Reset Failed',
        description: 'An error occurred during system reset. Please try again.',
        variant: 'destructive',
      });

      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All System Data
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            Reset System Data
          </DialogTitle>
          <DialogDescription>
            This will delete ALL system data including users, tournaments, and
            player records.
            {user?.email && (
              <span className="block mt-2 font-medium">
                Current user: {user.email}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300">
          <p>
            Warning: All data will be permanently deleted. You will be logged
            out and redirected to the homepage.
          </p>

          <p className="mt-2">
            <strong>Note:</strong> This will also attempt to delete the auth
            user from Supabase if it's a test account, allowing you to register
            with the same email again.
          </p>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset All Data'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetSystemData;
