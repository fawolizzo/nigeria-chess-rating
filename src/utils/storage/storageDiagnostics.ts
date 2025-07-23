// Storage diagnostics utilities
export const getStorageInfo = () => {
  const used = JSON.stringify(localStorage).length;
  const available = 5 * 1024 * 1024; // Assume 5MB limit

  return {
    used,
    available,
    percentage: (used / available) * 100,
  };
};
