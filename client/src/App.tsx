import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Using a Class component to avoid potential issues with hooks and re-rendering
class App extends React.Component {
  state = {
    message: "Hello, Investment Tracker!",
    year: new Date().getFullYear()
  };
  
  handleClick = () => {
    this.setState({ message: "App is working correctly!" });
  };
  
  render() {
    const { message, year } = this.state;
    
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex flex-col h-screen bg-gray-50" style={{ minHeight: '100vh' }}>
          {/* Simple Header */}
          <header className="bg-white shadow-sm p-4">
            <h1 className="text-xl font-bold text-center">Investment Tracker</h1>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: '80px' }}>
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-center">{message}</h2>
              <p className="text-gray-600 mb-4 text-center">
                This is a simplified version of the app to diagnose rendering issues.
              </p>
              <div className="flex justify-center mt-6">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={this.handleClick}
                >
                  Click Me
                </button>
              </div>
            </div>
          </main>
          
          {/* Simple Footer */}
          <footer className="bg-white border-t border-gray-200 p-4 text-center text-sm text-gray-600 fixed bottom-0 w-full">
            Investment Tracker © {year}
          </footer>
        </div>
      </QueryClientProvider>
    );
  }
}

export default App;