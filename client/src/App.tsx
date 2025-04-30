import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MealLogging from "@/pages/MealLogging";
import FoodDatabase from "@/pages/FoodDatabase";
import ProgressTracking from "@/pages/ProgressTracking";
import Reports from "@/pages/Reports";
import Goals from "@/pages/Goals";
import Settings from "@/pages/Settings";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/meal-logging" component={MealLogging} />
      <Route path="/food-database" component={FoodDatabase} />
      <Route path="/progress-tracking" component={ProgressTracking} />
      <Route path="/reports" component={Reports} />
      <Route path="/goals" component={Goals} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="flex h-screen overflow-hidden">
            <Sidebar mobileMenuOpen={mobileMenuOpen} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <MobileHeader toggleMobileMenu={toggleMobileMenu} />
              <main className="flex-1 overflow-y-auto">
                <Router />
              </main>
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
