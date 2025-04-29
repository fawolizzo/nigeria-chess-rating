
import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TIME_CONTROLS } from "@/data/timeControls";
import { TournamentFormSchemaType } from "./TournamentFormSchema";
import { validateTimeControl } from "@/utils/timeControlValidation";

interface TournamentConfigFieldsProps {
  form: UseFormReturn<TournamentFormSchemaType>;
  isCustomTimeControl: boolean;
  setIsCustomTimeControl: (value: boolean) => void;
  customTimeControl: string;
  setCustomTimeControl: (value: string) => void;
  customTimeControlError: string | null;
  setCustomTimeControlError: (value: string | null) => void;
}

export function TournamentConfigFields({ 
  form, 
  isCustomTimeControl, 
  setIsCustomTimeControl,
  customTimeControl,
  setCustomTimeControl,
  customTimeControlError,
  setCustomTimeControlError
}: TournamentConfigFieldsProps) {
  
  // Validate the custom time control whenever it changes
  useEffect(() => {
    if (isCustomTimeControl) {
      const validationResult = validateTimeControl(customTimeControl);
      if (!validationResult.isValid) {
        setCustomTimeControlError(validationResult.error || "Invalid time control format");
      } else {
        setCustomTimeControlError(null);
      }
    } else {
      setCustomTimeControlError(null);
    }
  }, [customTimeControl, isCustomTimeControl, setCustomTimeControlError]);

  return (
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
                        <SelectItem key={timeControl.value} value={timeControl.value}>
                          {timeControl.label}
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
                        // Validation will be handled by the useEffect
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
  );
}
