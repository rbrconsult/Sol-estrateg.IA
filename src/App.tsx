import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Admin from "./pages/Admin";
import Chamados from "./pages/Chamados";
import Monitoramento from "./pages/Monitoramento";
import Ajuda from "./pages/Ajuda";
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
                  <MainLayout><Index /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/pipeline" element={
                <ProtectedRoute>
                  <MainLayout><Pipeline /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/forecast" element={
                <ProtectedRoute>
                  <MainLayout><Forecast /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/atividades" element={
                <ProtectedRoute>
                  <MainLayout><Atividades /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/vendedores" element={
                <ProtectedRoute>
                  <MainLayout><Vendedores /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/perdas" element={
                <ProtectedRoute>
                  <MainLayout><Perdas /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/origens" element={
                <ProtectedRoute>
                  <MainLayout><Origens /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <MainLayout><Admin /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/chamados" element={
                <ProtectedRoute>
                  <MainLayout><Chamados /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/monitoramento" element={
                <ProtectedRoute>
                  <MainLayout><Monitoramento /></MainLayout>
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
