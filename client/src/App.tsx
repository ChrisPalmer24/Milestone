import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Super simple app with basic navigation
function App() {
  const [tab, setTab] = useState(1);
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white p-4 shadow">
          <h1 className="text-xl font-bold text-center">Investment Tracker</h1>
        </header>
        
        {/* Content */}
        <main className="p-4 pb-20">
          {tab === 1 && (
            <div className="bg-white rounded p-4 shadow mb-4">
              <h2 className="text-lg font-bold mb-2">Portfolio Tab</h2>
              <p>Your portfolio overview will appear here.</p>
            </div>
          )}
          
          {tab === 2 && (
            <div className="bg-white rounded p-4 shadow mb-4">
              <h2 className="text-lg font-bold mb-2">Goals Tab</h2>
              <p>Your investment goals will appear here.</p>
            </div>
          )}
          
          {tab === 3 && (
            <div className="bg-white rounded p-4 shadow mb-4">
              <h2 className="text-lg font-bold mb-2">Settings Tab</h2>
              <p>App settings will appear here.</p>
            </div>
          )}
        </main>
        
        {/* Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex justify-around">
            <button 
              onClick={() => setTab(1)} 
              className={`py-3 flex-1 text-center ${tab === 1 ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
            >
              Portfolio
            </button>
            <button 
              onClick={() => setTab(2)} 
              className={`py-3 flex-1 text-center ${tab === 2 ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
            >
              Goals
            </button>
            <button 
              onClick={() => setTab(3)} 
              className={`py-3 flex-1 text-center ${tab === 3 ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
            >
              Settings
            </button>
          </div>
        </nav>
      </div>
    </QueryClientProvider>
  );
}

export default App;