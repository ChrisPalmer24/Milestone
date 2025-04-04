import React from 'react';

interface InvestEngineLogoProps {
  className?: string;
  color?: string;
}

export const InvestEngineLogo: React.FC<InvestEngineLogoProps> = ({ 
  className = "w-6 h-6", 
  color = "#304FFE" // InvestEngine blue color
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 36 36" 
      className={className}
      fill={color}
      aria-label="InvestEngine Logo"
    >
      {/* Central circle */}
      <circle cx="18" cy="18" r="5" />
      
      {/* Outer segments */}
      <path d="M18,0 C8.1,0,0,8.1,0,18s8.1,18,18,18s18-8.1,18-18S27.9,0,18,0z M18,5c7.2,0,13,5.8,13,13s-5.8,13-13,13S5,25.2,5,18S10.8,5,18,5z" />
      
      {/* Distinctive cuts/lines */}
      <path d="M3,18.5h8l-4-9z" />
      <path d="M25,18.5h8l-4,9z" />
      <path d="M17.5,4v7l-6-3z" />
    </svg>
  );
};

export default InvestEngineLogo;