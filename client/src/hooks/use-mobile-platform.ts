import { useState, useEffect } from 'react';
import { isNativePlatform } from '../capacitor';

/**
 * Hook that detects if the app is running on a native mobile platform
 * This uses Capacitor's detection to determine if we're on iOS/Android
 */
export function useMobilePlatform() {
  const [isMobilePlatform, setIsMobilePlatform] = useState(false);

  useEffect(() => {
    // Check if we're on a native platform
    setIsMobilePlatform(isNativePlatform());
  }, []);

  return isMobilePlatform;
}