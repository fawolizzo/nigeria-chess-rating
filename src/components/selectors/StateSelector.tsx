
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getAllStates } from "@/lib/nigerianStates";

interface StateSelectorProps {
  selectedState?: string;
  onStateChange?: (state: string) => void;
  value?: string;
  onValueChange?: (state: string) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}

const StateSelector = ({
  selectedState,
  onStateChange,
  value,
  onValueChange,
  className,
  disabled = false,
  label
}: StateSelectorProps) => {
  const [states, setStates] = useState<string[]>([]);
  
  // Use the provided value or selectedState prop
  const currentValue = value !== undefined ? value : selectedState;
  
  // Use the provided onValueChange or onStateChange callback
  const handleChange = (state: string) => {
    if (onValueChange) {
      onValueChange(state);
    } else if (onStateChange) {
      onStateChange(state);
    }
  };
  
  useEffect(() => {
    setStates(getAllStates());
  }, []);
  
  return (
    <div className="flex flex-col space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select 
        value={currentValue} 
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select a state" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {states.map(state => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default StateSelector;
