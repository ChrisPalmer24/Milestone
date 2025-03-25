import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simplified for debugging - removed service worker and PWA-related code
console.log('Mounting app in simplified mode for debugging');

// Render the app directly
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found! Check the HTML for an element with id="root"');
}
