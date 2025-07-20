import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface TournamentConfigFieldsProps {
  form: UseFormReturn<any>;
  isCustomTimeControl: boolean;
  validateCustomTimeControl: (value: string) => string | null;
  updateCustomTimeControlState: (value: string) => void;
  watchTimeControl: string;
}

export const TournamentConfigFields: React.FC<TournamentConfigFieldsProps> = ({
  form,
  isCustomTimeControl,
  validateCustomTimeControl,
  updateCustomTimeControlState,
  watchTimeControl,
}) => {
  const timeControlOptions = [
    { value: '90+30', label: '90 minutes + 30 seconds (Classical)' },
    { value: '25+10', label: '25 minutes + 10 seconds (Rapid)' },
    { value: '5+3', label: '5 minutes + 3 seconds (Blitz)' },
    { value: '3+2', label: '3 minutes + 2 seconds (Blitz)' },
    { value: 'custom', label: 'Custom Time Control' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="rounds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Rounds *</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                max="20"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="timeControl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time Control *</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                updateCustomTimeControlState(value);
              }}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select time control" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {timeControlOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {isCustomTimeControl && (
        <FormField
          control={form.control}
          name="customTimeControl"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Custom Time Control *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 60+15 (format: minutes+increment)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="registrationOpen"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Open Registration</FormLabel>
              <div className="text-sm text-muted-foreground">
                Allow players to register for this tournament
              </div>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

export default TournamentConfigFields;
