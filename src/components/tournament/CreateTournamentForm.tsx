
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { NIGERIAN_STATES, TIME_CONTROLS } from "@/lib/nigerianStates";
import { TournamentFormValues } from "@/hooks/useTournamentManager";
import { format } from "date-fns";

const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.date({
    required_error: "Start date is required",
    invalid_type_error: "Start date is invalid",
  }),
  endDate: z.date({
    required_error: "End date is required",
    invalid_type_error: "End date is invalid",
  }),
  location: z.string().min(3, "Location is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  rounds: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().min(1)
  ),
  timeControl: z.string().min(2, "Time control is required")
}).refine(data => {
  // Ensure both dates are valid Date objects
  return data.startDate instanceof Date && !isNaN(data.startDate.getTime()) &&
         data.endDate instanceof Date && !isNaN(data.endDate.getTime());
}, {
  message: "Both start date and end date must be valid dates",
  path: ["startDate"]
}).refine(data => {
  // Only check if end date is after start date if both dates are valid
  if (data.startDate instanceof Date && !isNaN(data.startDate.getTime()) &&
      data.endDate instanceof Date && !isNaN(data.endDate.getTime())) {
    return data.endDate >= data.startDate;
  }
  return true; // Skip this validation if dates aren't valid (first refine will catch that)
}, {
  message: "End date must be on or after start date",
  path: ["endDate"]
});

interface CreateTournamentFormProps {
  onSubmit: (data: TournamentFormValues, customTimeControl: string, isCustomTimeControl: boolean) => void;
  onCancel: () => void;
}

export function CreateTournamentForm({ onSubmit, onCancel }: CreateTournamentFormProps) {
  const [isCustomTimeControl, setIsCustomTimeControl] = useState(false);
  const [customTimeControl, setCustomTimeControl] = useState("");
  const [customTimeControlError, setCustomTimeControlError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      location: "",
      city: "",
      state: "",
      rounds: 9,
      timeControl: ""
    },
    mode: "onChange" // Validate on change instead of just on submit
  });

  // Watch for form state changes to update the isFormValid state
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Check if the form is valid
      form.trigger().then(isValid => {
        const hasCustomTimeControlError = isCustomTimeControl && !customTimeControl;
        setIsFormValid(isValid && !hasCustomTimeControlError);
      });
    });
    
    return () => subscription.unsubscribe();
  }, [form, form.watch, isCustomTimeControl, customTimeControl]);

  const handleSubmit = (data: TournamentFormValues) => {
    if (!isFormValid) return;
    onSubmit(data, customTimeControl, isCustomTimeControl);
  };

  // Format date for display in debug messages (if needed)
  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date) return "undefined";
    if (!(date instanceof Date) || isNaN(date.getTime())) return "Invalid Date";
    return format(date, "yyyy-MM-dd");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter tournament name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide a description of your tournament" 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  minDate={form.getValues("startDate")}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter venue name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city" {...field} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NIGERIAN_STATES.map((state) => (
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rounds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Rounds</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rounds" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[5, 6, 7, 8, 9, 11].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Rounds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormField
              control={form.control}
              name="timeControl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Control</FormLabel>
                  <div className="space-y-2">
                    {!isCustomTimeControl ? (
                      <Select 
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setIsCustomTimeControl(true);
                            setCustomTimeControlError(null);
                            field.onChange("");
                          } else {
                            field.onChange(value);
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time control" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_CONTROLS.map((timeControl) => (
                            <SelectItem key={timeControl} value={timeControl}>
                              {timeControl}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom Time Control</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input 
                          value={customTimeControl}
                          onChange={(e) => {
                            setCustomTimeControl(e.target.value);
                            setCustomTimeControlError(
                              e.target.value ? null : "Custom time control is required"
                            );
                            // Update form validity when custom time control changes
                            form.trigger().then(isValid => {
                              setIsFormValid(isValid && !!e.target.value);
                            });
                          }}
                          placeholder="e.g., 90min or 15min + 10sec"
                          className={customTimeControlError ? "border-red-500" : ""}
                        />
                        {customTimeControlError && (
                          <p className="text-sm text-red-500">{customTimeControlError}</p>
                        )}
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsCustomTimeControl(false)}
                        >
                          Use preset time control
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!isFormValid || form.formState.isSubmitting}
          >
            Create Tournament
          </Button>
        </div>
      </form>
    </Form>
  );
}
