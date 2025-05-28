
import { nigerianStates as statesData, NIGERIA_STATES } from "@/lib/nigerianStates";

export const nigerianStatesArray = NIGERIA_STATES;

// Create citiesByState mapping from the lib data
export const citiesByState: Record<string, string[]> = {};

// Populate citiesByState from the nigerianStates data
statesData.forEach(state => {
  // Map "Federal Capital Territory" to "FCT" for consistency
  const stateName = state.name === "Federal Capital Territory" ? "FCT" : state.name;
  citiesByState[stateName] = state.cities;
});

// Also add direct state name mappings for flexibility
statesData.forEach(state => {
  citiesByState[state.name] = state.cities;
});

// Export individual functions for getting cities
export const getCitiesForState = (stateName: string): string[] => {
  return citiesByState[stateName] || [];
};

// Export nigerianStates directly
export { statesData as nigerianStates };
// Re-export for backward compatibility
export { statesData as statesWithCities };
