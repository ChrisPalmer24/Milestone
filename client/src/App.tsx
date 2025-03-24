import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/context/PortfolioContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Portfolio from "@/pages/portfolio";
import Goals from "@/pages/goals";
import Record from "@/pages/record";
import Track from "@/pages/track";
import Fire from "@/pages/fire";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/goals" component={Goals} />
      <Route path="/record" component={Record} />
      <Route path="/track" component={Track} />
      <Route path="/fire" component={Fire} />
      <Route component={NotFound} />
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
