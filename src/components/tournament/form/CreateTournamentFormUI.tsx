
import { FormProvider } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { NIGERIA_STATES } from '@/data/nigeriaStates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIME_CONTROLS } from '@/data/timeControls';

interface CreateTournamentFormUIProps {
  form: any;
  isCustomTimeControl: boolean;
  watchTimeControl: any;
  isSubmitting: boolean;
  errorMsg: string | null;
  validateCustomTimeControl: (value: string) => string | true;
  updateCustomTimeControlState: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function CreateTournamentFormUI({
  form,
  isCustomTimeControl,
  watchTimeControl,
  isSubmitting,
  errorMsg,
  validateCustomTimeControl,
  updateCustomTimeControlState,
  onCancel,
  onSubmit
}: CreateTournamentFormUIProps) {
  const { register, setValue, watch, formState: { errors } } = form;

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Tournament</h1>
      
      {errorMsg && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
      
      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
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
              setValue('timeControl', value as any);
              updateCustomTimeControlState(value);
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
              onClick={onCancel}
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
      </FormProvider>
    </Card>
  );
}
