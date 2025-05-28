
import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { citiesByState } from "@/data/nigeriaStates";

export interface CitySelectorProps {
  selectedState: string;
  selectedCity: string; 
  onCityChange: (city: string) => void;
  // Add the missing state prop that's being used in PlayerSearchInput
  state?: string;
  value?: string;
  onChange?: (city: string) => void;
  className?: string;
}

export const CitySelector: React.FC<CitySelectorProps> = ({ 
  selectedState, 
  selectedCity, 
  onCityChange,
  state, // Handle both selectedState and state props
  value, // Handle both selectedCity and value props
  onChange, // Handle both onCityChange and onChange props
  className
}) => {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Use state or selectedState (fallback)
  const currentState = state || selectedState;
  // Use value or selectedCity (fallback)
  const currentCity = value || selectedCity;
  // Use onChange or onCityChange (fallback)
  const handleChange = onChange || onCityChange;

  // Update cities list when state changes
  useEffect(() => {
    if (currentState) {
      const stateCities = citiesByState[currentState] || [];
      setAvailableCities(stateCities);
      
      // If the current selected city isn't in the new state's cities, reset it
      if (currentCity && !stateCities.includes(currentCity)) {
        handleChange("");
      }
    } else {
      setAvailableCities([]);
      if (currentCity) handleChange("");
    }
  }, [currentState, currentCity, handleChange]);

  return (
    <Select 
      value={currentCity} 
      onValueChange={handleChange}
      disabled={!currentState || availableCities.length === 0}
    >
      <SelectTrigger className={className || "w-full"}>
        <SelectValue placeholder="Select city" />
      </SelectTrigger>
      <SelectContent>
        {availableCities.length === 0 ? (
          <SelectItem value="none" disabled>
            No cities available
          </SelectItem>
        ) : (
          availableCities.map(city => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default CitySelector;
