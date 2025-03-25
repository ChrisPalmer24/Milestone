import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

/**
 * Detect if running on a native mobile platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initialize Capacitor plugins and configuration
 */
export const initializeCapacitor = () => {
  if (!isNativePlatform()) {
    return; // Only run on native platforms
  }

  // Set up status bar
  StatusBar.setBackgroundColor({ color: '#3B82F6' });
  StatusBar.setStyle({ style: Capacitor.getPlatform() === 'ios' ? Style.Dark : Style.Light });

  // Set up back button behavior for Android
  App.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      App.exitApp();
    } else {
      window.history.back();
    }
  });

  // Listen for keyboard events
  Keyboard.addListener('keyboardWillShow', () => {
    // Adjust UI if needed when keyboard shows
  });

  Keyboard.addListener('keyboardWillHide', () => {
    // Adjust UI if needed when keyboard hides
  });
};

/**
 * Trigger haptic feedback for user interactions
 */
export const triggerHapticFeedback = async () => {
  if (isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
};

/**
 * Store data persistently using Capacitor's Preferences API
 */
export const storeData = async (key: string, value: any) => {
  await Preferences.set({
    key,
    value: JSON.stringify(value),
  });
};

/**
 * Retrieve data from Capacitor's Preferences API
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  const { value } = await Preferences.get({ key });
  
  if (value) {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.error('Error parsing stored data:', e);
    }
  }
  
  return null;
};

/**
 * Remove data from storage
 */
export const removeData = async (key: string) => {
  await Preferences.remove({ key });
};