
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
  selectedCity: string;
  onCityChange: (city: string) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}

const CitySelector = ({
  state,
  selectedCity,
  onCityChange,
  className,
  disabled = false,
  label
}: CitySelectorProps) => {
  const [cities, setCities] = useState<string[]>([]);
  
  useEffect(() => {
    if (state) {
      setCities(getCitiesByState(state));
    } else {
      setCities([]);
    }
  }, [state]);
  
  // Reset selected city if state changes and selected city isn't in the new list
  useEffect(() => {
    if (state && selectedCity && !getCitiesByState(state).includes(selectedCity)) {
      onCityChange('');
    }
  }, [state, selectedCity, onCityChange]);
  
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
          value={selectedCity} 
          onValueChange={onCityChange}
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
