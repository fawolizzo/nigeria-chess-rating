
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getAllStates, getCitiesByState } from "@/lib/nigerianStates";

interface StateSelectorProps {
  selectedState: string;
  onStateChange: (state: string) => void;
  className?: string;
  disabled?: boolean;
}

const StateSelector = ({
  selectedState,
  onStateChange,
  className,
  disabled = false
}: StateSelectorProps) => {
  const [states, setStates] = useState<string[]>([]);
  
  useEffect(() => {
    setStates(getAllStates());
  }, []);
  
  return (
    <Select 
      value={selectedState} 
      onValueChange={onStateChange}
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
  );
};

export default StateSelector;
