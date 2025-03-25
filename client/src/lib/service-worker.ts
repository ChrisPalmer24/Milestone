// Service worker registration utility

export const registerServiceWorker = async (): Promise<void> => {
  // Temporarily disabled for debugging
  console.log('Service worker registration is disabled for debugging');
  return;
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('Service worker unregistered successfully');
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
    }
  }
};

// This function checks if the application meets the criteria for being installable as a PWA
export const checkPwaInstallable = async (): Promise<boolean> => {
  // Check if the browser supports BeforeInstallPromptEvent
  if (!('BeforeInstallPromptEvent' in window)) {
    return false;
  }
  
  // Service Worker API is required for PWAs
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  // Check if the app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }
  
  // If we got here, the app is installable
  return true;
};

// Listen for the beforeinstallprompt event
let deferredPrompt: any;

export const initPwaInstallListener = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
  });
};

export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const choiceResult = await deferredPrompt.userChoice;
  
  // Reset the deferred prompt variable, it can only be used once
  deferredPrompt = null;
  
  return choiceResult.outcome === 'accepted';
};