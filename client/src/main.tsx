import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Direct render with no extra features that could cause issues
const rootElement = document.getElementById("root");
if (rootElement) {
  console.log('Mounting app with basic class-based component');
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found!');
}
