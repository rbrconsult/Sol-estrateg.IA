import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGuard } from "@/components/ModuleGuard";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Pipeline from "./pages/Pipeline";
import Forecast from "./pages/Forecast";
import Atividades from "./pages/Atividades";
import Vendedores from "./pages/Vendedores";
import Perdas from "./pages/Perdas";
import Origens from "./pages/Origens";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import Chamados from "./pages/Chamados";
import Monitoramento from "./pages/Monitoramento";
import MakeErrors from "./pages/MakeErrors";
import Ajuda from "./pages/Ajuda";
import Leads from "./pages/Leads";
import Conferencia from "./pages/Conferencia";
import BI from "./pages/BI";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ImpersonationBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
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
                  <MainLayout><ModuleGuard moduleKey="pipeline"><Pipeline /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/forecast" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="forecast"><Forecast /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/atividades" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="atividades"><Atividades /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/vendedores" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="vendedores"><Vendedores /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/perdas" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="perdas"><Perdas /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/origens" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="origens"><Origens /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <MainLayout><Admin /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/chamados" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="chamados"><Chamados /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/monitoramento" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="monitoramento"><Monitoramento /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/make-errors" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="make-errors"><MakeErrors /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/ajuda" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="ajuda"><Ajuda /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute>
                  <MainLayout><Leads /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/bi" element={
                <ProtectedRoute>
                  <MainLayout><ModuleGuard moduleKey="bi"><BI /></ModuleGuard></MainLayout>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
