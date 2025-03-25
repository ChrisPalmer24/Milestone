import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeCapacitor } from "./capacitor";

// Initialize Capacitor for mobile platforms
document.addEventListener('DOMContentLoaded', () => {
  initializeCapacitor();
});

createRoot(document.getElementById("root")!).render(<App />);
