
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/user';
import { supabase } from '@/integrations/supabase/client';
import { TimeControlValue } from '@/data/timeControls';

interface CreateTournamentFormData {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  city: string;
  state: string;
  rounds: number;
  timeControl: TimeControlValue;
  customTimeControl?: string;
}

export function useCreateTournamentForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useUser();
  const [isCustomTimeControl, setIsCustomTimeControl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const form = useForm<CreateTournamentFormData>({
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1))
    }
  });

  const watchTimeControl = form.watch('timeControl');

  // Update isCustomTimeControl when the selected timeControl changes
  const updateCustomTimeControlState = (value: string) => {
    setIsCustomTimeControl(value === 'custom');
  };

  // Validate custom time control format
  const validateCustomTimeControl = (value: string) => {
    if (!value) return 'Time control is required';
    const pattern = /^\d+\+\d+$/;
    if (!pattern.test(value)) {
      return 'Invalid format. Use format like "90+30"';
    }
    return true;
  };

  // Form submission handler
  const handleSubmit = async (data: CreateTournamentFormData) => {
    try {
      if (!currentUser || !currentUser.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a tournament",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const timeControlValue = data.timeControl === 'custom' ? data.customTimeControl : data.timeControl;

      if (data.timeControl === 'custom' && !data.customTimeControl) {
        toast({
          title: "Validation Error",
          description: "Custom time control is required",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      setErrorMsg(null);
      
      // Format dates properly for database
      const formattedStartDate = data.startDate.toISOString().split('T')[0];
      const formattedEndDate = data.endDate.toISOString().split('T')[0];
      
      console.log("Submitting tournament data:", {
        name: data.name,
        description: data.description || '',
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        location: data.location,
        city: data.city,
        state: data.state,
        time_control: timeControlValue,
        rounds: data.rounds,
        organizer_id: currentUser.id,
        status: 'pending'
      });
      
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          name: data.name,
          description: data.description || '',
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          location: data.location,
          city: data.city,
          state: data.state,
          time_control: timeControlValue,
          rounds: data.rounds,
          organizer_id: currentUser.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating tournament:', error);
        setErrorMsg(`Database error: ${error.message}`);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Tournament created successfully',
      });

      navigate(`/tournaments/${tournament.id}`);
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tournament. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isCustomTimeControl,
    setIsCustomTimeControl,
    isSubmitting,
    errorMsg,
    validateCustomTimeControl,
    handleSubmit: form.handleSubmit(handleSubmit),
    updateCustomTimeControlState,
    navigate,
    watchTimeControl
  };
}
