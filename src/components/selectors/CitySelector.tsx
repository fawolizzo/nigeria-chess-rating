
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCitiesByState } from "@/lib/nigerianStates";

interface CitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onCityChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  selectedState,
  selectedCity,
  onCityChange,
  placeholder = "Select city",
  disabled = false
}) => {
  const cities = selectedState && selectedState !== "all-states" 
    ? getCitiesByState(selectedState) 
    : [];

  return (
    <Select 
      value={selectedCity} 
      onValueChange={onCityChange}
      disabled={disabled || !selectedState || selectedState === "all-states"}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all-cities">All Cities</SelectItem>
        {cities.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CitySelector;
