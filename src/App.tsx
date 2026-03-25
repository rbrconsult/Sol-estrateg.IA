import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { Lead360Provider } from "@/contexts/Lead360Context";
import { OrgFilterProvider } from "@/contexts/OrgFilterContext";
import { GlobalFilterProvider } from "@/contexts/GlobalFilterContext";
import { Lead360Drawer } from "@/components/lead360/Lead360Drawer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGuard } from "@/components/ModuleGuard";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Pipeline from "./pages/Pipeline";
import Forecast from "./pages/Forecast";
import Performance from "./pages/Performance";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Selecao from "./pages/Selecao";
import Admin from "./pages/Admin";
import Chamados from "./pages/Chamados";
import Operacoes from "./pages/Operacoes";
import Ajuda from "./pages/Ajuda";
import Leads from "./pages/Leads";
import Conferencia from "./pages/Conferencia";
import BI from "./pages/BI";
import AdsPerformance from "./pages/AdsPerformance";
import RoboSol from "./pages/RoboSol";
import RoboFupFrio from "./pages/RoboFupFrio";
import JornadaLead from "./pages/JornadaLead";
import Roadmap from "./pages/Roadmap";
import PainelComercial from "./pages/PainelComercial";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import SLAMonitor from "./pages/SLAMonitor";
import MidiaReceita from "./pages/MidiaReceita";
import AnalistaFollowup from "./pages/AnalistaFollowup";
import Comissoes from "./pages/Comissoes";
import Sanitizacao from "./pages/Sanitizacao";
import Qualificacao from "./pages/Qualificacao";
import Reprocessamento from "./pages/Reprocessamento";
import OrgConfigPage from "./pages/admin/OrgConfigPage";
import PreVenda from "./pages/solar/PreVenda";
import Comercial from "./pages/solar/Comercial";
import VendedorPerformance from "./pages/solar/VendedorPerformance";
import { SolarLayout } from "./components/layout/SolarLayout";
import GA4Page from "./pages/GA4";
import CampanhasVisaoGeral from "./pages/campanhas/VisaoGeral";
import MetaAdsPage from "./pages/campanhas/MetaAds";
import GoogleAdsPage from "./pages/campanhas/GoogleAds";
import SiteGA4Page from "./pages/campanhas/SiteGA4";
import WhatsAppPage from "./pages/campanhas/WhatsApp";
import FunilConsolidado from "./pages/campanhas/FunilConsolidado";
import CampanhasAdsPerformance from "./pages/campanhas/AdsPerformance";
import CampanhasMidiaReceita from "./pages/campanhas/MidiaReceita";
import GA4Campanhas from "./pages/campanhas/GA4Campanhas";
import TimeComercialPage from "./pages/TimeComercialPage";
const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrgFilterProvider>
        <GlobalFilterProvider>
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
              <Route path="/selecao" element={<ProtectedRoute><Selecao /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Navigate to="/selecao" replace /></ProtectedRoute>} />

              {/* Solar Market */}
              <Route path="/solarmarket/prevenda" element={<ProtectedRoute><SolarLayout><PreVenda /></SolarLayout></ProtectedRoute>} />
              <Route path="/solarmarket/comercial" element={<ProtectedRoute><SolarLayout><Comercial /></SolarLayout></ProtectedRoute>} />
              <Route path="/solarmarket/vendedores" element={<ProtectedRoute><SolarLayout><VendedorPerformance /></SolarLayout></ProtectedRoute>} />

              {/* Conferência (antigo dashboard SM) */}
              <Route path="/conferencia" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="conferencia"><Conferencia /></ModuleGuard></MainLayout></ProtectedRoute>} />

              {/* Dashboard principal */}

              {/* Pipeline unificado DS Thread + DS Comercial */}
              <Route path="/pipeline" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="pipeline"><Pipeline /></ModuleGuard></MainLayout></ProtectedRoute>} />

              {/* Propostas = Forecast */}
              <Route path="/forecast" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="pipeline"><Forecast /></ModuleGuard></MainLayout></ProtectedRoute>} />

              {/* Contratos → redireciona para Forecast (propostas ganhas) */}
              <Route path="/contratos" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="pipeline"><Forecast /></ModuleGuard></MainLayout></ProtectedRoute>} />

              {/* Vendedores */}
              <Route path="/performance" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="vendedores"><Performance /></ModuleGuard></MainLayout></ProtectedRoute>} />

              {/* Demais páginas */}
              <Route path="/chamados" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="chamados"><Chamados /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/bi" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><BI /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/operacoes" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="monitoramento"><Operacoes /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute><MainLayout><Leads /></MainLayout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><MainLayout><Admin /></MainLayout></ProtectedRoute>} />
              <Route path="/admin/filial/:orgId" element={<ProtectedRoute><MainLayout><OrgConfigPage /></MainLayout></ProtectedRoute>} />
              <Route path="/ajuda" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="ajuda"><Ajuda /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/ads-performance" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><AdsPerformance /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/robo-sol" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><RoboSol /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/robo-fup-frio" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><RoboFupFrio /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/jornada-lead" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><JornadaLead /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/roadmap" element={<ProtectedRoute><MainLayout><Roadmap /></MainLayout></ProtectedRoute>} />
              <Route path="/painel-comercial" element={<ProtectedRoute><MainLayout><PainelComercial /></MainLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
              <Route path="/sla" element={<ProtectedRoute><MainLayout><SLAMonitor /></MainLayout></ProtectedRoute>} />
              <Route path="/midia" element={<ProtectedRoute><MainLayout><MidiaReceita /></MainLayout></ProtectedRoute>} />
              <Route path="/followup" element={<ProtectedRoute><MainLayout><AnalistaFollowup /></MainLayout></ProtectedRoute>} />
              <Route path="/comissoes" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="vendedores"><Comissoes /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/sanitizacao" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="monitoramento"><Sanitizacao /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/qualificacao" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="monitoramento"><Qualificacao /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/reprocessamento" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="monitoramento"><Reprocessamento /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/ga4" element={<ProtectedRoute><MainLayout><GA4Page /></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><CampanhasVisaoGeral /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/meta" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><MetaAdsPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/google" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><GoogleAdsPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/site" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><SiteGA4Page /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/whatsapp" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><WhatsAppPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/funil" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><FunilConsolidado /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/time-comercial" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="time-comercial"><TimeComercialPage /></ModuleGuard></MainLayout></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </Lead360Provider>
        </GlobalFilterProvider>
        </OrgFilterProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
