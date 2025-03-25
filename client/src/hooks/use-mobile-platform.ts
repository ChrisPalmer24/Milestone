import { useState, useEffect } from 'react';
import { isNativePlatform } from '../capacitor';

/**
 * Hook that detects if the app is running on a mobile native platform
 * via Capacitor, returns true for iOS and Android, false for web
 */
export function useMobilePlatform() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if this is running on a native mobile platform
    setIsMobile(isNativePlatform());
  }, []);
  
  return isMobile;
}