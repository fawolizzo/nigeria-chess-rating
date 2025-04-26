
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  minDate?: Date
  className?: string
}

export function DatePicker({ date, setDate, minDate, className }: DatePickerProps) {
  // Set default minimum date to today if not provided
  const defaultMinDate = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const effectiveMinDate = minDate || defaultMinDate;

  // Format the displayed date, showing "Invalid Date" if the date is invalid
  const formattedDate = React.useMemo(() => {
    if (!date) return null;
    return date instanceof Date && !isNaN(date.getTime()) 
      ? format(date, "PPP") 
      : "Invalid Date";
  }, [date]);

  // Determine if the date is invalid for styling
  const isInvalidDate = date && (!(date instanceof Date) || isNaN(date.getTime()));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            isInvalidDate && "border-red-500 text-red-500",
            className
          )}
        >
          <CalendarIcon className={cn("mr-2 h-4 w-4", isInvalidDate && "text-red-500")} />
          {formattedDate || <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date instanceof Date && !isNaN(date.getTime()) ? date : undefined}
          onSelect={setDate}
          initialFocus
          disabled={(date) => date < effectiveMinDate}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  )
}
