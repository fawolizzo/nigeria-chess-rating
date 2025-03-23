
import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const Logo: React.FC<LogoProps> = ({ className = "", showText = true, size = "md" }) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-16",
    xl: "h-24"
  };
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl"
  };

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/6230bbb1-6c31-468f-a539-e5b1dd982a0a.png" 
        alt="Nigerian Chess Rating System Logo" 
        className={`${sizeClasses[size]}`}
      />
      {showText && (
        <span className={`ml-2 font-bold ${textSizeClasses[size]} text-nigeria-green`}>
          NCR System
        </span>
      )}
    </Link>
  );
};

export default Logo;
