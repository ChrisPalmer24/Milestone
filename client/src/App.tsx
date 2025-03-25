import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/context/PortfolioContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { useState, useEffect } from "react";
// Import pages directly without layout wrappers
import Portfolio from "@/pages/portfolio";
import Goals from "@/pages/goals";
import Record from "@/pages/record";
import Track from "@/pages/track";
import Fire from "@/pages/fire";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import ApiConnections from "@/pages/api-connections";

// Simplified application with minimal layout nesting
function Router() {
  // DirectRender component to simplify the rendering process
  const DirectRender = ({ component: Component }: { component: React.ComponentType }) => {
    return <Component />;
  };

  return (
    <Switch>
      <Route path="/">
        {() => <DirectRender component={Home} />}
      </Route>
      <Route path="/portfolio">
        {() => <DirectRender component={Portfolio} />}
      </Route>
      <Route path="/goals">
        {() => <DirectRender component={Goals} />}
      </Route>
      <Route path="/record">
        {() => <DirectRender component={Record} />}
      </Route>
      <Route path="/track">
        {() => <DirectRender component={Track} />}
      </Route>
      <Route path="/fire">
        {() => <DirectRender component={Fire} />}
      </Route>
      <Route path="/profile">
        {() => <DirectRender component={Profile} />}
      </Route>
      <Route path="/settings">
        {() => <DirectRender component={Settings} />}
      </Route>
      <Route path="/api-connections">
        {() => <DirectRender component={ApiConnections} />}
      </Route>
      <Route>
        {() => <DirectRender component={NotFound} />}
      </Route>
    </Switch>
  );
}

function App() {
  const [error, setError] = useState<Error | null>(null);
  
  // Error handler for the entire app
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      setError(event.error || new Error("An unknown error occurred"));
      // Prevent the default error handler
      event.preventDefault();
    };

    window.addEventListener("error", handleGlobalError);
    
    return () => {
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  // If we have an error, show the error UI
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
        <p className="text-gray-700 mb-6">
          We're sorry, something went wrong while loading the application.
        </p>
        <div className="bg-gray-200 p-4 rounded mb-6 max-w-lg overflow-auto">
          <code className="text-sm text-red-800">{error.message}</code>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reload Application
        </button>
      </div>
    );
  }

  // Simplified app structure 
  return (
    <QueryClientProvider client={queryClient}>
      <PortfolioProvider>
        <Router />
        <Toaster />
      </PortfolioProvider>
    </QueryClientProvider>
  );
}

export default App;
