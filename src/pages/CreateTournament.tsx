
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/user';
import { NIGERIA_STATES } from '@/data/nigeriaStates';
import { TIME_CONTROLS, TimeControlValue } from '@/data/timeControls';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

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

export default function CreateTournament() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useUser();
  const [isCustomTimeControl, setIsCustomTimeControl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<CreateTournamentFormData>({
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1))
    }
  });

  const selectedTimeControl = watch('timeControl');

  useEffect(() => {
    setIsCustomTimeControl(selectedTimeControl === 'custom');
  }, [selectedTimeControl]);

  const validateCustomTimeControl = (value: string) => {
    if (!value) return 'Time control is required';
    const pattern = /^\d+\+\d+$/;
    if (!pattern.test(value)) {
      return 'Invalid format. Use format like "90+30"';
    }
    return true;
  };

  const onSubmit = async (data: CreateTournamentFormData) => {
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
      
      console.log("Submitting tournament data:", {
        name: data.name,
        description: data.description || '',
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
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
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
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

      navigate(`/tournament/${tournament.id}`);
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

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Tournament</h1>
        
        {errorMsg && (
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}
        
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
                date={watch('startDate')}
                setDate={(date) => date && setValue('startDate', date)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DatePicker 
                date={watch('endDate')}
                setDate={(date) => date && setValue('endDate', date)}
                minDate={watch('startDate')}
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
              <Select onValueChange={(value) => setValue('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIA_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Number of Rounds</label>
              <Input
                type="number"
                min="1"
                max="15"
                {...register('rounds', { 
                  required: 'Number of rounds is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Minimum 1 round' },
                  max: { value: 15, message: 'Maximum 15 rounds' }
                })}
              />
              {errors.rounds && (
                <p className="text-red-500 text-sm mt-1">{errors.rounds.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Time Control</label>
            <Select onValueChange={(value) => {
              setValue('timeControl', value as TimeControlValue);
              setIsCustomTimeControl(value === 'custom');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select time control" />
              </SelectTrigger>
              <SelectContent>
                {TIME_CONTROLS.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isCustomTimeControl && (
              <div className="mt-2">
                <Input
                  {...register('customTimeControl', {
                    validate: validateCustomTimeControl
                  })}
                  placeholder="Enter time control (e.g., 90+30)"
                  className="mt-2"
                />
                {errors.customTimeControl && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.customTimeControl.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Format: minutes+increment (e.g., 90+30 means 90 minutes + 30 seconds increment)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-6">
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
