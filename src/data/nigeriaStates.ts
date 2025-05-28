
import { nigerianStates, getCitiesByState } from "@/lib/nigerianStates";

export const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", 
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", 
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export const nigerianStatesArray = NIGERIA_STATES;

// Create citiesByState mapping from the lib data
export const citiesByState: Record<string, string[]> = {};

// Populate citiesByState from the nigerianStates data
nigerianStates.forEach(state => {
  // Map "Federal Capital Territory" to "FCT" for consistency
  const stateName = state.name === "Federal Capital Territory" ? "FCT" : state.name;
  citiesByState[stateName] = state.cities;
});

// Also add direct state name mappings for flexibility
nigerianStates.forEach(state => {
  citiesByState[state.name] = state.cities;
});

// Export individual functions for getting cities
export const getCitiesForState = (stateName: string): string[] => {
  return citiesByState[stateName] || [];
};

// Re-export for backward compatibility
export { nigerianStates as statesWithCities } from "@/lib/nigerianStates";
