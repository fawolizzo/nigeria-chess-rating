import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTournament } from '@/services/tournament/tournamentService';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import {
  TournamentFormData,
  createTournamentSchema,
} from '@/components/tournament/form/TournamentFormSchema';

export const useCreateTournamentForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCustomTimeControl, setIsCustomTimeControl] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useUser();

  // Initialize the form with react-hook-form
  const form = useForm<TournamentFormData>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      city: '',
      state: '',
      rounds: 5,
      timeControl: '90+30',
      registrationOpen: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  const watchTimeControl = form.watch('timeControl');

  const validateCustomTimeControl = (value: string): string | null => {
    if (!value.trim()) {
      return 'Custom time control is required';
    }
    // Basic validation for time control format (e.g., "90+30", "120+0")
    const timeControlPattern = /^\d+(\+\d+)?$/;
    if (!timeControlPattern.test(value.trim())) {
      return "Invalid time control format. Use format like '90+30' or '120+0'";
    }
    return null;
  };

  const updateCustomTimeControlState = (value: string) => {
    setIsCustomTimeControl(value === 'custom');
  };

  const handleSubmit = async (data: TournamentFormData): Promise<boolean> => {
    console.log('🔍 Tournament creation debug info:');
    console.log('📝 Form data:', data);
    console.log('👤 Current user from context:', currentUser);

    // Check Supabase auth directly as fallback
    const { supabase } = await import('@/integrations/supabase/client');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log('🔍 Supabase session:', session);
    console.log('👤 Supabase user:', session?.user);

    let userId = currentUser?.id;
    let userEmail = currentUser?.email;

    // If no currentUser from context, try to get from Supabase session
    if (!currentUser && session?.user) {
      console.log(
        '⚠️ Using Supabase session as fallback for missing context user'
      );
      userId = session.user.id;
      userEmail = session.user.email;
    }

    if (!userId) {
      console.error('❌ No user found in context or Supabase session');
      setErrorMsg('You must be logged in to create a tournament');
      toast({
        title: 'Error',
        description:
          'You must be logged in to create a tournament. Please check your authentication status.',
        variant: 'destructive',
      });
      return false;
    }

    console.log('✅ User found:', userId, userEmail);

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // First, let's check if this user exists in the organizers table
      console.log('🔍 Checking if user exists in organizers table...');

      const tournamentData = {
        name: data.name,
        description: data.description || '',
        location: data.location,
        city: data.city,
        state: data.state,
        rounds: data.rounds,
        start_date: data.startDate.toISOString().split('T')[0],
        end_date: data.endDate.toISOString().split('T')[0],
        time_control: data.timeControl,
        organizer_id: userId,
        registration_open: data.registrationOpen,
        status: 'approved' as const, // Auto-approve tournaments from approved organizers
        participants: 0,
        current_round: 1,
        players: [],
        pairings: [],
        results: [],
      };

      console.log('🏆 Creating tournament with data:', tournamentData);
      console.log('🔑 Using organizer_id:', userId);

      const tournament = await createTournament(tournamentData);

      console.log('✅ Tournament created successfully:', tournament);

      toast({
        title: 'Tournament Created',
        description: `${tournament.name} has been created successfully and is ready for player registration.`,
      });

      // Reset form after successful submission
      form.reset();
      return true;
    } catch (error) {
      console.error('❌ Tournament creation error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });

      let errorMessage = 'Failed to create tournament. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          errorMessage = `Authentication error: Your user account (${currentUser.id}) is not registered as a Tournament Organizer. Please contact a Rating Officer to register as an organizer first.`;
        } else if (error.message.includes('organizer_id')) {
          errorMessage = `Organizer validation failed: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }

      setErrorMsg(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    handleSubmit,
    isSubmitting,
    errorMsg,
    isCustomTimeControl,
    validateCustomTimeControl,
    updateCustomTimeControlState,
    watchTimeControl,
  };
};
