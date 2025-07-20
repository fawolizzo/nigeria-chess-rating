import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getCitiesByState } from '@/lib/nigerianStates';
import { Edit3 } from 'lucide-react';

interface CitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onCityChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  selectedState,
  selectedCity,
  onCityChange,
  placeholder = 'Select city',
  disabled = false,
  className = '',
}) => {
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customCity, setCustomCity] = useState('');

  const cities =
    selectedState && selectedState !== 'all-states'
      ? getCitiesByState(selectedState)
      : [];

  const handleSelectChange = (value: string) => {
    if (value === 'custom-city') {
      setIsCustomInput(true);
      setCustomCity(selectedCity);
    } else {
      setIsCustomInput(false);
      onCityChange(value);
    }
  };

  const handleCustomCitySubmit = () => {
    if (customCity.trim()) {
      onCityChange(customCity.trim());
      setIsCustomInput(false);
    }
  };

  const handleCustomCityCancel = () => {
    setIsCustomInput(false);
    setCustomCity('');
  };

  if (isCustomInput) {
    return (
      <div className="flex gap-2">
        <Input
          value={customCity}
          onChange={(e) => setCustomCity(e.target.value)}
          placeholder="Enter your city name"
          className="flex-1"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCustomCitySubmit();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleCustomCitySubmit}
          disabled={!customCity.trim()}
        >
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCustomCityCancel}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select
        value={selectedCity}
        onValueChange={handleSelectChange}
        disabled={disabled || !selectedState || selectedState === 'all-states'}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-cities">All Cities</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
          <SelectItem value="custom-city" className="text-blue-600 font-medium">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Type custom city...
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CitySelector;
