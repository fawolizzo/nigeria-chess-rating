
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NIGERIA_CITIES } from "@/lib/nigerianStates";

interface CitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onCityChange: (value: string) => void;
  className?: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  selectedState,
  selectedCity,
  onCityChange,
  className = ""
}) => {
  const availableCities = selectedState ? NIGERIA_CITIES[selectedState] || [] : [];

  return (
    <Select value={selectedCity} onValueChange={onCityChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select city" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all-cities">All Cities</SelectItem>
        {availableCities.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CitySelector;
