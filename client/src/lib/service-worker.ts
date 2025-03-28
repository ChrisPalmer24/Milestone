// Service worker registration utility

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // Force fresh service worker by appending a timestamp
      const swUrl = `/sw.js?v=${Date.now()}`;
      console.log('Attempting to register service worker from:', swUrl);
      
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
      });
      
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('Service worker state changed:', newWorker.state);
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available and will be used when all tabs are closed
              console.log('New content is available and will be used when all tabs are closed');
            }
          });
        }
      });

      let refreshing = false;
      // When the user asks to refresh the UI, we'd want to reload automatically.
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
      
      console.log('Service worker registration successful:', registration);
      return;
      
    } catch (error) {
      console.error('Service worker registration failed with detailed info:', error);
      // Additional debugging info
      if (error instanceof TypeError) {
        console.error('This might be a network error or CORS issue');
      } else if (error instanceof DOMException) {
        console.error('This might be a security policy issue or invalid scope');
      }
    }
  } else {
    console.log('Service Worker API not supported in this browser');
  }
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