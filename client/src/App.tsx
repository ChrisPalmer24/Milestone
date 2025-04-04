import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { SessionProvider } from "@/context/SessionContext";
import { DateRangeProvider } from "@/context/DateRangeContext";
import { useSession } from "@/hooks/use-session";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Portfolio from "@/pages/portfolio";
import Goals from "@/pages/goals";
import Track from "@/pages/track";
import Fire from "@/pages/fire";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import ApiConnections from "@/pages/api-connections";
import Account from "@/pages/account";
import Record from "@/pages/record";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { Loader2 } from "lucide-react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
function RouteWithLayout({
  component: Component,
  ...rest
}: {
  component: React.ComponentType;
}) {
  return (
    <ResponsiveLayout>
      <Component {...rest} />
    </ResponsiveLayout>
  );
}

function Router() {
  return (
    <WouterRouter>
      <Switch>
        {/* Auth Routes */}
        <Route path="/login">{() => <LoginPage />}</Route>
        <Route path="/register">{() => <RegisterPage />}</Route>

        {/* Protected Routes */}
        <Route path="/">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Home} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/portfolio">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Portfolio} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/goals">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Goals} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/track">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Track} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/record">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Record} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/fire">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Fire} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/profile">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Profile} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/settings">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Settings} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/api-connections">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={ApiConnections} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/account/:id">
          {() => (
            <ProtectedRoute>
              <RouteWithLayout component={Account} />
            </ProtectedRoute>
          )}
        </Route>
        <Route>{() => <RouteWithLayout component={NotFound} />}</Route>
      </Switch>
    </WouterRouter>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
      <p className="text-gray-600 text-lg font-medium">Loading your data...</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <PortfolioProvider>
          <DateRangeProvider>
            <Router />
            <Toaster />
          </DateRangeProvider>
        </PortfolioProvider>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
