
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import StateSelector from "@/components/selectors/StateSelector";
import CitySelector from "@/components/selectors/CitySelector";
import { useState } from "react";

interface PlayerSearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
  onFilterChange?: (filters: { state?: string; city?: string }) => void;
  showFilters?: boolean;
}

export const PlayerSearchInput = ({
  searchQuery,
  setSearchQuery,
  placeholder = "Search players by name, title, rating...",
  onFilterChange,
  showFilters = false
}: PlayerSearchInputProps) => {
  const [selectedState, setSelectedState] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>();

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity(undefined);
    if (onFilterChange) {
      onFilterChange({ state, city: undefined });
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (onFilterChange) {
      onFilterChange({ state: selectedState, city });
    }
  };

  const clearFilters = () => {
    setSelectedState(undefined);
    setSelectedCity(undefined);
    if (onFilterChange) {
      onFilterChange({ state: undefined, city: undefined });
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder={placeholder}
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className={selectedState || selectedCity ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filter Players</h4>
              
              <div className="space-y-2">
                <label className="text-sm">State</label>
                <StateSelector
                  value={selectedState}
                  onChange={handleStateChange}
                  className="w-full"
                />
              </div>
              
              {selectedState && (
                <div className="space-y-2">
                  <label className="text-sm">City</label>
                  <CitySelector
                    state={selectedState}
                    value={selectedCity}
                    onChange={handleCityChange}
                    className="w-full"
                  />
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  disabled={!selectedState && !selectedCity}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default PlayerSearchInput;
