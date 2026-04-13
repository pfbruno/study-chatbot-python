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
import TeacherDashboard from "./pages/app/TeacherDashboard";
import Analytics from "./pages/app/Analytics";
import PlaceholderPage from "./pages/app/PlaceholderPage";
import Simulados from "./pages/app/Simulados";
import SimuladoDetail from "./pages/app/SimuladoDetail";
import SimuladoResolver from "./pages/app/SimuladoResolver";
import SimuladoResult from "./pages/app/SimuladoResult";
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
            <Route path="simulados" element={<Simulados />} />
            <Route path="simulados/:id" element={<SimuladoDetail />} />
            <Route path="simulados/:id/resolver" element={<SimuladoResolver />} />
            <Route path="simulados/:id/resultado" element={<SimuladoResult />} />
            <Route path="questoes" element={<PlaceholderPage />} />
            <Route path="chat" element={<PlaceholderPage />} />
            <Route path="estudo" element={<PlaceholderPage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="professor" element={<TeacherDashboard />} />
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
