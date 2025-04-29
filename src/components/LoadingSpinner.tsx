
import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex justify-center">
    <div className="w-12 h-12 border-4 border-t-transparent border-nigeria-green rounded-full animate-spin"></div>
  </div>
);

export const SmallLoadingSpinner = () => (
  <div className="flex justify-center">
    <div className="w-6 h-6 border-2 border-t-transparent border-nigeria-green rounded-full animate-spin"></div>
  </div>
);
