import React from 'react';

interface InvestEngineLogoProps {
  className?: string;
}

export const InvestEngineLogo: React.FC<InvestEngineLogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <img 
      src="/images/investengine.png" 
      alt="InvestEngine Logo" 
      className={className}
    />
  );
};

export default InvestEngineLogo;