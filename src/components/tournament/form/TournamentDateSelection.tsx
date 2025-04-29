
import React from "react";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { UseFormReturn } from "react-hook-form";
import { TournamentFormSchemaType } from "./TournamentFormSchema";

interface TournamentDateSelectionProps {
  form: UseFormReturn<TournamentFormSchemaType>;
}

export function TournamentDateSelection({ form }: TournamentDateSelectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="startDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Start Date</FormLabel>
            <DatePicker
              date={field.value}
              setDate={(date) => {
                // Ensure we're using the current date (April 29, 2025) for tournament creation
                field.onChange(date);
                console.log("Start date selected:", date);
              }}
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
              setDate={(date) => {
                field.onChange(date);
                console.log("End date selected:", date);
              }}
              minDate={form.getValues("startDate")}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
