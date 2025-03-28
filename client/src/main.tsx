import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeCapacitor } from "./capacitor";
import { isNativePlatform } from "./capacitor";

// Initialize Capacitor for mobile platforms and register service worker
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Capacitor for native mobile platforms
  initializeCapacitor();

  /**
   * Temporary disabled PWA support as this is handled by Vite PWA plugin
   * This code is left here to be considered to turn off service worker on native mobile apps
   */
  // // Only register service worker on web (not needed for native mobile apps)
  // if (!isNativePlatform()) {
  //   // Register service worker for PWA support
  //   registerServiceWorker();

  //   // Initialize PWA install prompt listener
  //   initPwaInstallListener();

  //   // Add manifest link in the head
  //   const manifestLink = document.createElement('link');
  //   manifestLink.rel = 'manifest';
  //   manifestLink.href = '/manifest.json';
  //   document.head.appendChild(manifestLink);

  //   // Add theme-color meta tag
  //   const themeColorMeta = document.createElement('meta');
  //   themeColorMeta.name = 'theme-color';
  //   themeColorMeta.content = '#3B82F6';
  //   document.head.appendChild(themeColorMeta);
  // }
});

createRoot(document.getElementById("root")!).render(<App />);
