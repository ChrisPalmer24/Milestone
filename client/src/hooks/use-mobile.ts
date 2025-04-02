import { useState, useEffect } from 'react';

/**
 * Hook that detects if the app is being viewed on a mobile-sized viewport
 * based on screen width, regardless of platform
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Check on mount
    checkSize();
    
    // Set up event listener for window resize
    window.addEventListener('resize', checkSize);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isMobile;
}