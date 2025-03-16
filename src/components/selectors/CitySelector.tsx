
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getCitiesByState } from "@/lib/nigerianStates";

interface CitySelectorProps {
  state: string;
  selectedCity?: string;
  value?: string; // Add value as an alternative to selectedCity
  onCityChange?: (city: string) => void;
  onChange?: (city: string) => void; // Add onChange as an alternative to onCityChange
  className?: string;
  disabled?: boolean;
  label?: string;
}

const CitySelector = ({
  state,
  selectedCity,
  value,
  onCityChange,
  onChange,
  className,
  disabled = false,
  label
}: CitySelectorProps) => {
  const [cities, setCities] = useState<string[]>([]);
  
  // Use value prop if provided, otherwise use selectedCity
  const currentValue = value !== undefined ? value : selectedCity;
  
  // Use appropriate handler based on provided props
  const handleChange = (city: string) => {
    if (onChange) {
      onChange(city);
    } else if (onCityChange) {
      onCityChange(city);
    }
  };
  
  useEffect(() => {
    if (state) {
      setCities(getCitiesByState(state));
    } else {
      setCities([]);
    }
  }, [state]);
  
  // Reset selected city if state changes and selected city isn't in the new list
  useEffect(() => {
    if (state && currentValue && !getCitiesByState(state).includes(currentValue)) {
      handleChange('');
    }
  }, [state, currentValue]);
  
  return (
    <div className="flex flex-col space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      {!state ? (
        <Select disabled={true}>
          <SelectTrigger className={className}>
            <SelectValue placeholder="Select a state first" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup></SelectGroup>
          </SelectContent>
        </Select>
      ) : (
        <Select 
          value={currentValue} 
          onValueChange={handleChange}
          disabled={disabled || cities.length === 0}
        >
          <SelectTrigger className={className}>
            <SelectValue placeholder="Select a city" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {cities.map(city => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default CitySelector;
