import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/context/PortfolioContext";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Portfolio from "@/pages/portfolio";
import Goals from "@/pages/goals";
import Record from "@/pages/record";
import Track from "@/pages/track";
import Fire from "@/pages/fire";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import ApiConnections from "@/pages/api-connections";

function RouteWithLayout({ component: Component, ...rest }: { component: React.ComponentType }) {
  try {
    return (
      <ResponsiveLayout>
        <Component {...rest} />
      </ResponsiveLayout>
    );
  } catch (error) {
    console.error("Error rendering route with layout:", error);
    // Fallback to direct component rendering if layout fails
    return <Component {...rest} />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <RouteWithLayout component={Home} />}
      </Route>
      <Route path="/portfolio">
        {() => <RouteWithLayout component={Portfolio} />}
      </Route>
      <Route path="/goals">
        {() => <RouteWithLayout component={Goals} />}
      </Route>
      <Route path="/record">
        {() => <RouteWithLayout component={Record} />}
      </Route>
      <Route path="/track">
        {() => <RouteWithLayout component={Track} />}
      </Route>
      <Route path="/fire">
        {() => <RouteWithLayout component={Fire} />}
      </Route>
      <Route path="/profile">
        {() => <RouteWithLayout component={Profile} />}
      </Route>
      <Route path="/settings">
        {() => <RouteWithLayout component={Settings} />}
      </Route>
      <Route path="/api-connections">
        {() => <RouteWithLayout component={ApiConnections} />}
      </Route>
      <Route>
        {() => <RouteWithLayout component={NotFound} />}
      </Route>
    </Switch>
  );
}

function App() {
  // Add error boundary for the main app
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <PortfolioProvider>
          <Router />
          <Toaster />
        </PortfolioProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("Critical application error:", error);
    // Fallback UI in case of critical errors
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
        <p className="text-gray-700 mb-6">We're sorry, something went wrong while loading the application.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reload Application
        </button>
      </div>
    );
  }
}

export default App;
