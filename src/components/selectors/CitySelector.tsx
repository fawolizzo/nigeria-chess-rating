
import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { citiesByState } from "@/data/nigeriaStates";

export interface CitySelectorProps {
  selectedState: string;
  selectedCity: string; 
  onCityChange: (city: string) => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({ 
  selectedState, 
  selectedCity, 
  onCityChange 
}) => {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Update cities list when state changes
  useEffect(() => {
    if (selectedState) {
      const stateCities = citiesByState[selectedState] || [];
      setAvailableCities(stateCities);
      
      // If the current selected city isn't in the new state's cities, reset it
      if (selectedCity && !stateCities.includes(selectedCity)) {
        onCityChange("");
      }
    } else {
      setAvailableCities([]);
      if (selectedCity) onCityChange("");
    }
  }, [selectedState, selectedCity, onCityChange]);

  return (
    <Select 
      value={selectedCity} 
      onValueChange={onCityChange}
      disabled={!selectedState || availableCities.length === 0}
    >
      <SelectTrigger className="w-full">
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
