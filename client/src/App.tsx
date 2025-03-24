import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/context/PortfolioContext";
import MainLayout from "@/components/layout/MainLayout";
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
  return (
    <MainLayout>
      <Component {...rest} />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
