import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { TrendingUp, Flag, ClipboardEdit, LineChart, Flame, Settings as SettingsIcon } from "lucide-react";
import Portfolio from "@/pages/portfolio";
import Goals from "@/pages/goals";
import Record from "@/pages/record";
import Track from "@/pages/track";
import Fire from "@/pages/fire";
import Settings from "@/pages/settings";

function App() {
  const [currentPage, setCurrentPage] = useState("portfolio");
  
  // Extremely simplified app with minimal navigation
  const renderPage = () => {
    switch (currentPage) {
      case "portfolio":
        return <Portfolio />;
      case "goals":
        return <Goals />;
      case "record":
        return <Record />;
      case "track":
        return <Track />;
      case "fire":
        return <Fire />;
      case "settings":
        return <Settings />;
      default:
        return <Portfolio />;
    }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <PortfolioProvider>
        <div className="flex flex-col h-screen bg-gray-50">
          {/* Simple Header */}
          <header className="bg-white shadow-sm p-4">
            <h1 className="text-xl font-bold text-center">Investment Tracker</h1>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto pb-16 px-4">
            {renderPage()}
          </main>
          
          {/* Simple Bottom Navigation */}
          <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full">
            <ul className="flex justify-between px-2">
              <li className="flex-1">
                <button 
                  className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "portfolio" ? "text-blue-600" : ""}`}
                  onClick={() => setCurrentPage("portfolio")}
                >
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-xs">Portfolio</span>
                </button>
              </li>
              <li className="flex-1">
                <button 
                  className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "goals" ? "text-blue-600" : ""}`}
                  onClick={() => setCurrentPage("goals")}
                >
                  <Flag className="w-6 h-6" />
                  <span className="text-xs">Goals</span>
                </button>
              </li>
              <li className="flex-1">
                <button 
                  className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "record" ? "text-blue-600" : ""}`}
                  onClick={() => setCurrentPage("record")}
                >
                  <ClipboardEdit className="w-6 h-6" />
                  <span className="text-xs">Record</span>
                </button>
              </li>
              <li className="flex-1">
                <button 
                  className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "track" ? "text-blue-600" : ""}`}
                  onClick={() => setCurrentPage("track")}
                >
                  <LineChart className="w-6 h-6" />
                  <span className="text-xs">Track</span>
                </button>
              </li>
              <li className="flex-1">
                <button 
                  className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "fire" ? "text-blue-600" : ""}`}
                  onClick={() => setCurrentPage("fire")}
                >
                  <Flame className="w-6 h-6" />
                  <span className="text-xs">FIRE</span>
                </button>
              </li>
              <li className="flex-1">
                <button 
                  className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "settings" ? "text-blue-600" : ""}`}
                  onClick={() => setCurrentPage("settings")}
                >
                  <SettingsIcon className="w-6 h-6" />
                  <span className="text-xs">Settings</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </PortfolioProvider>
    </QueryClientProvider>
  );
}

export default App;
