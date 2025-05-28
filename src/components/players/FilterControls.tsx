
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CitySelector from "../selectors/CitySelector";
import { NIGERIA_STATES } from "@/data/nigeriaStates";

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedState: string;
  onStateChange: (value: string) => void;
  selectedCity: string;
  onCityChange: (value: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  searchQuery,
  onSearchChange,
  selectedState,
  onStateChange,
  selectedCity,
  onCityChange
}) => {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Search Players
        </label>
        <Input
          id="searchQuery"
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div>
        <label htmlFor="stateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Filter by State
        </label>
        <Select 
          value={selectedState}
          onValueChange={onStateChange}
        >
          <SelectTrigger id="stateFilter" className="w-full">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All States</SelectItem>
            {NIGERIA_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label htmlFor="cityFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Filter by City
        </label>
        <CitySelector
          selectedState={selectedState}
          selectedCity={selectedCity}
          onCityChange={onCityChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default FilterControls;
