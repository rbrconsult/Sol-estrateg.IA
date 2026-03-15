import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { Lead360Provider } from "@/contexts/Lead360Context";
import { Lead360Drawer } from "@/components/lead360/Lead360Drawer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGuard } from "@/components/ModuleGuard";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import PipelinePage from "./pages/PipelinePage";
import Performance from "./pages/Performance";

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import Chamados from "./pages/Chamados";
import Operacoes from "./pages/Operacoes";
import Ajuda from "./pages/Ajuda";
import Leads from "./pages/Leads";
import Conferencia from "./pages/Conferencia";
import BI from "./pages/BI";
import Roadmap from "./pages/Roadmap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Lead360Provider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ImpersonationBanner />
          <Lead360Drawer />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="conferencia"><Conferencia /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="dashboard"><Index /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/pipeline" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="pipeline"><PipelinePage /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/performance" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="vendedores"><Performance /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/atividades" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="atividades"><Atividades /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/chamados" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="chamados"><Chamados /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/bi" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="bi"><BI /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/operacoes" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="monitoramento"><Operacoes /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute>
                  <MainLayout><Leads /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <MainLayout><Admin /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/ajuda" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="ajuda"><Ajuda /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/roadmap" element={
                <ProtectedRoute>
                  <MainLayout><Roadmap /></MainLayout>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </Lead360Provider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
