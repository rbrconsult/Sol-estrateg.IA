import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { Lead360Drawer } from "@/components/lead360/Lead360Drawer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGuard } from "@/components/ModuleGuard";
import { MainLayout } from "@/components/layout/MainLayout";

import { AppProviders } from "@/providers/AppProviders";
import { PageLoader } from "@/components/ui/PageLoader";

// Lazy Loaded Pages
const Index = lazy(() => import("./pages/Index"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Forecast = lazy(() => import("./pages/Forecast"));
const Contratos = lazy(() => import("./pages/Contratos"));
const Performance = lazy(() => import("./pages/Performance"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Selecao = lazy(() => import("./pages/Selecao"));

const Admin = lazy(() => import("./pages/Admin"));
const Chamados = lazy(() => import("./pages/Chamados"));
const Operacoes = lazy(() => import("./pages/Operacoes"));

const Leads = lazy(() => import("./pages/Leads"));
const Conferencia = lazy(() => import("./pages/Conferencia"));
const BI = lazy(() => import("./pages/BI"));
const RoboSol = lazy(() => import("./pages/RoboSol"));
const RoboFupFrio = lazy(() => import("./pages/RoboFupFrio"));

const Roadmap = lazy(() => import("./pages/Roadmap"));
const PainelComercial = lazy(() => import("./pages/PainelComercial"));

const NotFound = lazy(() => import("./pages/NotFound"));
const SLAMonitor = lazy(() => import("./pages/SLAMonitor"));

const AnalistaFollowup = lazy(() => import("./pages/AnalistaFollowup"));
const Comissoes = lazy(() => import("./pages/Comissoes"));
const Sanitizacao = lazy(() => import("./pages/Sanitizacao"));
const Qualificacao = lazy(() => import("./pages/Qualificacao"));
const Desqualificar = lazy(() => import("./pages/Desqualificar"));
const Reprocessamento = lazy(() => import("./pages/Reprocessamento"));
const OrgConfigPage = lazy(() => import("./pages/admin/OrgConfigPage"));

const CampanhasVisaoGeral = lazy(() => import("./pages/campanhas/VisaoGeral"));
const MetaAdsPage = lazy(() => import("./pages/campanhas/MetaAds"));
const GoogleAdsPage = lazy(() => import("./pages/campanhas/GoogleAds"));
const SiteGA4Page = lazy(() => import("./pages/campanhas/SiteGA4"));
const WhatsAppPage = lazy(() => import("./pages/campanhas/WhatsApp"));
const FunilConsolidado = lazy(() => import("./pages/campanhas/FunilConsolidado"));
const CampanhasAdsPerformance = lazy(() => import("./pages/campanhas/AdsPerformance"));
const CampanhasMidiaReceita = lazy(() => import("./pages/campanhas/MidiaReceita"));
const GA4Campanhas = lazy(() => import("./pages/campanhas/GA4Campanhas"));
const TimeComercialPage = lazy(() => import("./pages/TimeComercialPage"));
const SolConfigPage = lazy(() => import("./pages/admin/SolConfigPage"));
const SolEquipePage = lazy(() => import("./pages/admin/SolEquipePage"));
const SolFunisPage = lazy(() => import("./pages/admin/SolFunisPage"));
const Insights = lazy(() => import("./pages/Insights"));


/** Rotas com error boundary por URL: ao mudar de página, o boundary reinicia (evita ficar preso na tela de erro). */
function AppRoutesShell() {
  const location = useLocation();
  return (
    <AppErrorBoundary key={location.pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/selecao" element={<ProtectedRoute><Selecao /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Navigate to="/selecao" replace /></ProtectedRoute>} />
              <Route path="/solarmarket/*" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard Pré-Venda */}
              <Route path="/dashboard" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="conferencia"><Conferencia /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/conferencia" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard principal */}

              {/* Pipeline */}
              <Route path="/pipeline" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="pipeline"><Pipeline /></ModuleGuard></MainLayout></ProtectedRoute>} />

              {/* Propostas = Forecast */}
              <Route path="/forecast" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="pipeline"><Forecast /></ModuleGuard></MainLayout></ProtectedRoute>} />

              {/* Contratos → redireciona para Forecast (propostas ganhas) */}
              <Route path="/contratos-fechados" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="pipeline"><Contratos /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/contratos" element={<Navigate to="/contratos-fechados" replace />} />

              {/* Vendedores */}
              <Route path="/performance" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="vendedores"><Performance /></ModuleGuard></MainLayout></ProtectedRoute>} />

              {/* Demais páginas */}
              <Route path="/chamados" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="chamados"><Chamados /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/bi" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><BI /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/operacoes" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="monitoramento"><Operacoes /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="leads"><Leads /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><MainLayout><Admin /></MainLayout></ProtectedRoute>} />
              <Route path="/admin/filial/:orgId" element={<ProtectedRoute><MainLayout><OrgConfigPage /></MainLayout></ProtectedRoute>} />
              
              {/* Legacy redirects */}
              <Route path="/ads-performance" element={<Navigate to="/campanhas/ads" replace />} />
              <Route path="/midia" element={<Navigate to="/campanhas/receita" replace />} />
              <Route path="/ga4" element={<Navigate to="/campanhas/ga4" replace />} />

              <Route path="/robo-sol" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="robo-sol"><RoboSol /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/robo-fup-frio" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="robo-fup-frio"><RoboFupFrio /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/jornada-lead" element={<Navigate to="/sla" replace />} />
              <Route path="/roadmap" element={<ProtectedRoute><MainLayout><Roadmap /></MainLayout></ProtectedRoute>} />
              <Route path="/painel-comercial" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="painel-comercial"><PainelComercial /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/reports" element={<Navigate to="/insights" replace />} />
              <Route path="/sla" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="sla-monitor"><SLAMonitor /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/followup" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="followup"><AnalistaFollowup /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/comissoes" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="comissoes"><Comissoes /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/sanitizacao" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="monitoramento"><Sanitizacao /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/qualificacao" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="leads"><Qualificacao /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/desqualificar" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="leads"><Desqualificar /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/reprocessamento" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="leads"><Reprocessamento /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><CampanhasVisaoGeral /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/meta" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><MetaAdsPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/google" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><GoogleAdsPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/site" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><SiteGA4Page /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/whatsapp" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><WhatsAppPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/funil" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><FunilConsolidado /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/ads" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><CampanhasAdsPerformance /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/receita" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><CampanhasMidiaReceita /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/campanhas/ga4" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><GA4Campanhas /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/time-comercial" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="time-comercial"><TimeComercialPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/sol/insights" element={<Navigate to="/leads" replace />} />
              <Route path="/admin/config" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="admin-config"><SolConfigPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/admin/equipe" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="admin-equipe"><SolEquipePage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/admin/funis" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="admin-funis"><SolFunisPage /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><MainLayout><ModuleGuard moduleKey="bi"><Insights /></ModuleGuard></MainLayout></ProtectedRoute>} />
              <Route path="/mensagens" element={<Navigate to="/dashboard" replace />} />

              <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}

const App = () => (
  <AppProviders>
    <AppErrorBoundary fallback={null}>
      <ImpersonationBanner />
      <Lead360Drawer />
    </AppErrorBoundary>
    <BrowserRouter>
      <AppRoutesShell />
    </BrowserRouter>
  </AppProviders>
);

export default App;
