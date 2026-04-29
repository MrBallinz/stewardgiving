import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Faith from "./pages/Faith";
import Demo from "./pages/Demo";
import FAQ from "./pages/FAQ";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Recipients from "./pages/Recipients";
import Covenant from "./pages/Covenant";
import Report from "./pages/Report";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Legal from "./pages/Legal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";
import { RequireAuth } from "./components/RequireAuth";
import { ChatWidget } from "./components/ChatWidget";
import { CookieBanner } from "./components/CookieBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/faith" element={<Faith />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/recipients" element={<RequireAuth><Recipients /></RequireAuth>} />
          <Route path="/covenant" element={<RequireAuth><Covenant /></RequireAuth>} />
          <Route path="/report" element={<RequireAuth><Report /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatWidget />
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
