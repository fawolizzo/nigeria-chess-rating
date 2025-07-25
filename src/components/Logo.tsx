import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12', // Increased from h-10
    lg: 'h-20', // Increased from h-16
    xl: 'h-28', // Increased from h-24
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg', // Increased from text-base
    lg: 'text-2xl', // Increased from text-xl
    xl: 'text-3xl', // Increased from text-2xl
  };

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img
        src="/lovable-uploads/cd12c0fd-5c90-4320-89be-a3d543be8bd9.png"
        alt="Nigerian Chess Rating System Logo"
        className={`${sizeClasses[size]}`}
      />
      {showText && (
        <span
          className={`ml-3 font-bold ${textSizeClasses[size]} text-nigeria-green`}
        >
          NCR System
        </span>
      )}
    </Link>
  );
};

export default Logo;
