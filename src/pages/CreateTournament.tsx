
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/user';
import { validateTimeControl } from '@/utils/timeControlValidation';

interface CreateTournamentFormData {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  city: string;
  state: string;
  rounds: number;
  timeControl: string;
}

export default function CreateTournament() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<CreateTournamentFormData>({
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1))
    }
  });

  const onSubmit = async (data: CreateTournamentFormData) => {
    try {
      // Validate time control format
      const timeControlValidation = validateTimeControl(data.timeControl);
      if (!timeControlValidation.isValid) {
        toast({
          title: "Invalid Time Control",
          description: timeControlValidation.error,
          variant: "destructive",
        });
        return;
      }

      if (!currentUser || !currentUser.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a tournament",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      setIsSubmitting(true);
      
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          name: data.name,
          description: data.description,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          location: data.location,
          city: data.city,
          state: data.state,
          time_control: data.timeControl,
          rounds: parseInt(String(data.rounds)),
          organizer_id: currentUser.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Tournament created successfully',
      });

      navigate(`/tournament/${tournament.id}`);
    } catch (error) {
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

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Tournament</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Tournament Name</label>
            <Input
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter tournament name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register('description')}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Enter tournament description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <DatePicker 
                date={control._formValues.startDate} 
                setDate={(date) => setValue('startDate', date as Date)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DatePicker 
                date={control._formValues.endDate} 
                setDate={(date) => setValue('endDate', date as Date)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input {...register('location', { required: 'Location is required' })} />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <Input {...register('city', { required: 'City is required' })} />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <Input {...register('state', { required: 'State is required' })} />
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number of Rounds</label>
              <Input
                type="number"
                {...register('rounds', { 
                  required: 'Number of rounds is required',
                  min: { value: 1, message: 'Must be at least 1 round' }
                })}
              />
              {errors.rounds && (
                <p className="text-red-500 text-sm mt-1">{errors.rounds.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Time Control</label>
            <Input
              {...register('timeControl', { required: 'Time control is required' })}
              placeholder="e.g., 90min or 15min + 10sec"
            />
            {errors.timeControl && (
              <p className="text-red-500 text-sm mt-1">{errors.timeControl.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organizer-dashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
