import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { TrendingUp, Flag, ClipboardEdit, LineChart, Flame, Settings as SettingsIcon } from "lucide-react";

// Simplified App with navigation but without complex components
function App() {
  const [currentPage, setCurrentPage] = useState("portfolio");
  
  // Content for each navigation tab
  const renderPageContent = () => {
    switch (currentPage) {
      case "portfolio":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
            <p className="text-gray-600 mb-4">
              This is a simplified portfolio view. Your accounts and balances will appear here.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-blue-800 font-medium">Welcome to your portfolio tracker!</p>
              <p className="text-blue-600 text-sm mt-2">Add your first investment account to get started.</p>
            </div>
          </div>
        );
      case "goals":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Investment Goals</h2>
            <p className="text-gray-600 mb-4">
              Set financial milestones and track your progress toward them.
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-green-800 font-medium">Start by creating your first milestone!</p>
              <p className="text-green-600 text-sm mt-2">Set targets for your overall portfolio or specific accounts.</p>
            </div>
          </div>
        );
      case "record":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Record Transactions</h2>
            <p className="text-gray-600 mb-4">
              Record deposits, withdrawals, and update account values.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-purple-800 font-medium">Keep your portfolio up to date!</p>
              <p className="text-purple-600 text-sm mt-2">Regular updates provide better insights into your progress.</p>
            </div>
          </div>
        );
      case "track":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Track Performance</h2>
            <p className="text-gray-600 mb-4">
              Monitor your investment performance over time.
            </p>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <p className="text-indigo-800 font-medium">Track your investment journey!</p>
              <p className="text-indigo-600 text-sm mt-2">Visual insights help you understand your progress better.</p>
            </div>
          </div>
        );
      case "fire":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">FIRE Calculator</h2>
            <p className="text-gray-600 mb-4">
              Plan for Financial Independence and Retiring Early.
            </p>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <p className="text-amber-800 font-medium">Set your retirement goals!</p>
              <p className="text-amber-600 text-sm mt-2">Calculate how long until you can achieve financial independence.</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
            <p className="text-gray-600 mb-4">
              Manage your app preferences and account connections.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 font-medium">Customize your experience!</p>
              <p className="text-gray-600 text-sm mt-2">Connect to trading platforms for automatic updates.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Welcome to Investment Tracker</h2>
            <p className="text-gray-600">Select a section to get started.</p>
          </div>
        );
    }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <PortfolioProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
            <h1 className="text-xl font-bold text-center">Investment Tracker</h1>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 p-4 pb-20">
            {renderPageContent()}
          </main>
          
          {/* Navigation - With a higher z-index to ensure it's visible */}
          <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-20 shadow-lg">
            <div className="max-w-screen-lg mx-auto">
              <ul className="flex justify-between px-2 py-1">
                <li className="flex-1">
                  <button 
                    className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "portfolio" ? "text-blue-600" : "text-gray-600"}`}
                    onClick={() => setCurrentPage("portfolio")}
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span className="text-xs">Portfolio</span>
                  </button>
                </li>
                <li className="flex-1">
                  <button 
                    className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "goals" ? "text-blue-600" : "text-gray-600"}`}
                    onClick={() => setCurrentPage("goals")}
                  >
                    <Flag className="w-6 h-6" />
                    <span className="text-xs">Goals</span>
                  </button>
                </li>
                <li className="flex-1">
                  <button 
                    className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "record" ? "text-blue-600" : "text-gray-600"}`}
                    onClick={() => setCurrentPage("record")}
                  >
                    <ClipboardEdit className="w-6 h-6" />
                    <span className="text-xs">Record</span>
                  </button>
                </li>
                <li className="flex-1">
                  <button 
                    className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "track" ? "text-blue-600" : "text-gray-600"}`}
                    onClick={() => setCurrentPage("track")}
                  >
                    <LineChart className="w-6 h-6" />
                    <span className="text-xs">Track</span>
                  </button>
                </li>
                <li className="flex-1">
                  <button 
                    className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "fire" ? "text-blue-600" : "text-gray-600"}`}
                    onClick={() => setCurrentPage("fire")}
                  >
                    <Flame className="w-6 h-6" />
                    <span className="text-xs">FIRE</span>
                  </button>
                </li>
                <li className="flex-1">
                  <button 
                    className={`flex flex-col items-center pt-2 pb-1 w-full ${currentPage === "settings" ? "text-blue-600" : "text-gray-600"}`}
                    onClick={() => setCurrentPage("settings")}
                  >
                    <SettingsIcon className="w-6 h-6" />
                    <span className="text-xs">Settings</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </PortfolioProvider>
    </QueryClientProvider>
  );
}

export default App;