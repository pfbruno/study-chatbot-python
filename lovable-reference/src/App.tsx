import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import PlaceholderPage from "./pages/app/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App routes (authenticated area) */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="simulados" element={<PlaceholderPage />} />
            <Route path="questoes" element={<PlaceholderPage />} />
            <Route path="chat" element={<PlaceholderPage />} />
            <Route path="estudo" element={<PlaceholderPage />} />
            <Route path="analytics" element={<PlaceholderPage />} />
            <Route path="comunidade" element={<PlaceholderPage />} />
            <Route path="grupos" element={<PlaceholderPage />} />
            <Route path="aulas" element={<PlaceholderPage />} />
            <Route path="conquistas" element={<PlaceholderPage />} />
            <Route path="conteudos" element={<PlaceholderPage />} />
            <Route path="planos" element={<PlaceholderPage />} />
            <Route path="indicacao" element={<PlaceholderPage />} />
            <Route path="configuracoes" element={<PlaceholderPage />} />
            <Route path="perfil" element={<PlaceholderPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
