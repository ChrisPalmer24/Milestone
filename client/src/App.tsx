import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { ThemeProvider } from "@/context/ThemeContext";
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
        <Route path="/">{() => <RouteWithLayout component={Home} />}</Route>
        <Route path="/portfolio">
          {() => <RouteWithLayout component={Portfolio} />}
        </Route>
        <Route path="/goals">
          {() => <RouteWithLayout component={Goals} />}
        </Route>
        <Route path="/track">
          {() => <RouteWithLayout component={Track} />}
        </Route>
        <Route path="/record">
          {() => <RouteWithLayout component={Record} />}
        </Route>
        <Route path="/fire">{() => <RouteWithLayout component={Fire} />}</Route>
        <Route path="/profile">
          {() => <RouteWithLayout component={Profile} />}
        </Route>
        <Route path="/settings">
          {() => <RouteWithLayout component={Settings} />}
        </Route>
        <Route path="/api-connections">
          {() => <RouteWithLayout component={ApiConnections} />}
        </Route>
        <Route path="/account/:id">
          {() => <RouteWithLayout component={Account} />}
        </Route>
        <Route>{() => <RouteWithLayout component={NotFound} />}</Route>
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PortfolioProvider>
          <Router />
          <Toaster />
        </PortfolioProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
