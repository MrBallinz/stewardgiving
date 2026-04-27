import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import { RequireAuth } from "./components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/recipients" element={<RequireAuth><Placeholder title="Recipients" blurb="Manage who receives your giving and how it's split." /></RequireAuth>} />
          <Route path="/covenant" element={<RequireAuth><Placeholder title="Your covenant" blurb="Edit your giving rule, minimum, and scripture anchor." /></RequireAuth>} />
          <Route path="/report" element={<RequireAuth><Placeholder title="Year-end report" blurb="A printable, tax-ready record of your stewardship." /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Placeholder title="Settings" blurb="Profile, business info, and account." /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
