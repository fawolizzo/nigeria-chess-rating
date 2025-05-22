
import React from "react";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps {
  className?: string;
  size?: SpinnerSize;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-2",
  xl: "w-12 h-12 border-3",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className, 
  size = "md" 
}) => {
  // Important: Using more specific tailwind classes to prevent being overridden
  return (
    <div 
      className={cn(
        "rounded-full border border-solid border-t-transparent animate-spin",
        sizeClasses[size],
        className || "border-green-600", // Default to green if no class provided
      )}
      aria-label="Loading"
    />
  );
};
