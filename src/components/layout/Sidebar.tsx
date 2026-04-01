import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Kanban,
  Sparkles, LogOut, Shield, Headset, RotateCcw, Presentation,
  BarChart3, TrendingUp, Megaphone, Bot, Repeat, Route,
  Zap, FileText, DollarSign, Clock, Target, Users,
  FileCheck, Handshake, Percent,
  Activity, RefreshCw, Eraser, Building2, Globe, HelpCircle,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useForceSync } from "@/hooks/useSolData";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AppRole = 'super_admin' | 'diretor' | 'gerente' | 'closer' | 'admin';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  moduleKey?: string;
  /** Which roles can see this item. If omitted, all roles see it. */
  minRole?: AppRole[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
  /** Which roles can see this group. If omitted, all roles see it. */
  minRole?: AppRole[];
}

/** Roles that can see strategic/intelligence pages */
const STRATEGIC_ROLES: AppRole[] = ['super_admin', 'diretor'];
/** Roles that can see managerial pages */
const MANAGERIAL_ROLES: AppRole[] = ['super_admin', 'diretor', 'gerente'];
/** All operational roles */
const ALL_ROLES: AppRole[] = ['super_admin', 'diretor', 'gerente', 'closer', 'admin'];

const menuGroups: MenuGroup[] = [
  {
    label: "Pré-Venda",
    items: [
      { title: "Dashboard", icon: Presentation, path: "/dashboard", moduleKey: "conferencia" },
      { title: "Leads", icon: Users, path: "/leads", moduleKey: "leads" },
      { title: "Robô SOL", icon: Bot, path: "/robo-sol", moduleKey: "robo-sol", minRole: MANAGERIAL_ROLES },
      { title: "Robô FUP Frio", icon: Repeat, path: "/robo-fup-frio", moduleKey: "robo-fup-frio", minRole: MANAGERIAL_ROLES },
      { title: "Funil Consolidado", icon: TrendingUp, path: "/campanhas/funil", moduleKey: "bi", minRole: MANAGERIAL_ROLES },
    ],
  },
  {
    label: "Comercial",
    items: [
      { title: "Painel Comercial", icon: Zap, path: "/painel-comercial", moduleKey: "painel-comercial" },
      { title: "Pipeline", icon: Kanban, path: "/pipeline", moduleKey: "pipeline" },
      { title: "Forecast", icon: FileCheck, path: "/forecast", moduleKey: "forecast", minRole: MANAGERIAL_ROLES },
      { title: "Contratos Fechados", icon: Handshake, path: "/contratos-fechados", moduleKey: "pipeline", minRole: MANAGERIAL_ROLES },
      { title: "Performance", icon: TrendingUp, path: "/performance", moduleKey: "vendedores", minRole: MANAGERIAL_ROLES },
      { title: "Comissões", icon: Percent, path: "/comissoes", moduleKey: "comissoes", minRole: MANAGERIAL_ROLES },
    ],
  },
  {
    label: "Inteligência",
    minRole: STRATEGIC_ROLES,
    items: [
      { title: "BI Dashboard", icon: BarChart3, path: "/bi", moduleKey: "bi" },
      { title: "Jornada Lead", icon: Route, path: "/jornada-lead", moduleKey: "jornada-lead" },
      { title: "Monitor de SLA", icon: Clock, path: "/sla", moduleKey: "sla-monitor" },
      { title: "Analista Follow-up", icon: Target, path: "/followup", moduleKey: "followup" },
      { title: "Reports WhatsApp", icon: FileText, path: "/reports", moduleKey: "reports" },
    ],
  },
  {
    label: "Campanhas",
    minRole: STRATEGIC_ROLES,
    items: [
      { title: "Visão Geral", icon: LayoutDashboard, path: "/campanhas", moduleKey: "bi" },
      { title: "Meta Ads", icon: Megaphone, path: "/campanhas/meta", moduleKey: "bi" },
      { title: "Google Ads", icon: Globe, path: "/campanhas/google", moduleKey: "bi" },
      { title: "Site (GA4)", icon: Globe, path: "/campanhas/site", moduleKey: "bi" },
      { title: "WhatsApp", icon: Zap, path: "/campanhas/whatsapp", moduleKey: "bi" },
      { title: "Ads Performance", icon: Megaphone, path: "/campanhas/ads", moduleKey: "bi" },
      { title: "Mídia × Receita", icon: DollarSign, path: "/campanhas/receita", moduleKey: "bi" },
      { title: "GA4 Campanhas", icon: Globe, path: "/campanhas/ga4", moduleKey: "bi" },
    ],
  },
  {
    label: "Operacional",
    minRole: MANAGERIAL_ROLES,
    items: [
      { title: "Chamados", icon: Headset, path: "/chamados", moduleKey: "chamados" },
      { title: "Monitor Make", icon: Activity, path: "/operacoes", moduleKey: "monitoramento" },
      { title: "Qualificar", icon: Sparkles, path: "/qualificacao", moduleKey: "leads" },
      { title: "Desqualificar", icon: RotateCcw, path: "/desqualificar", moduleKey: "leads" },
      { title: "Reprocessar", icon: RefreshCw, path: "/reprocessamento", moduleKey: "leads" },
      { title: "Sanitização", icon: Eraser, path: "/sanitizacao", moduleKey: "monitoramento" },
    ],
  },
];

interface SidebarProps {
  onResetOnboarding?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ onResetOnboarding, onNavigate }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, userRole } = useAuth();
  const { hasAccess } = useModulePermissions();
  const isMobile = useIsMobile();
  const isSuperAdmin = userRole === "super_admin";
  const { forceSync, isSyncing } = useForceSync();

  let orgFilter: ReturnType<typeof useOrgFilter> | null = null;
  try { orgFilter = useOrgFilter(); } catch {}


  const handleSignOut = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  const isCollapsed = false;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-screen bg-card border-r border-border/50 flex flex-col transition-all duration-300",
          isMobile
            ? "w-full"
            : "fixed left-0 top-0 z-50",
          isCollapsed ? "w-16" : "w-52"
        )}
      >
        {/* Header */}
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shrink-0">
              <span className="text-base font-black text-primary-foreground tracking-tighter">S</span>
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-warning animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-black tracking-tight text-foreground">Sol Estrateg.IA</h1>
                <p className="text-[10px] text-muted-foreground truncate">BI, CRM e Suporte</p>
              </div>
            )}
          </div>

          {/* Filial indicator for super admins */}
          {!isCollapsed && isSuperAdmin && orgFilter && (
            <button
              onClick={() => { navigate("/selecao"); handleNavClick(); }}
              className="mt-2 w-full flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/40 bg-muted/30 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              {orgFilter.isGlobal ? (
                <Globe className="h-3 w-3 text-primary shrink-0" />
              ) : (
                <Building2 className="h-3 w-3 text-warning shrink-0" />
              )}
              <span className="truncate font-medium">{orgFilter.selectedOrgName}</span>
            </button>
          )}
        </div>

        {/* Navigation — all groups always visible, no collapse */}
        <nav className="flex-1 p-1.5 overflow-y-auto space-y-1">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.moduleKey ? hasAccess(item.moduleKey) : true
            );
            if (visibleItems.length === 0) return null;

            return (
              <div
                key={group.label}
                className={cn(
                  "rounded-lg border border-border/30 bg-muted/20 p-1",
                  isCollapsed && "border-transparent bg-transparent p-0.5"
                )}
              >
                {/* Group label */}
                {!isCollapsed && (
                  <div className="px-2 pt-1 pb-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.label}
                    </span>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.path}>
                          <TooltipTrigger asChild>
                            <Link
                              to={item.path}
                              onClick={handleNavClick}
                              className={cn(
                                "flex items-center justify-center rounded-md transition-all text-xs px-0 py-2",
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              )}
                            >
                              <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "animate-pulse")} />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-2 rounded-md transition-all text-xs px-2.5 py-1.5",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "animate-pulse")} />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-1.5 border-t border-border/50 space-y-0.5">
          {/* Admin + Sync row */}
          <div className="flex items-center gap-1">
            {(userRole === "super_admin" || hasAccess("admin") || (userRole === "diretor" && hasAccess("admin-pessoas"))) && (
              <Link
                to="/admin"
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-2 flex-1 px-2.5 py-1.5 rounded-lg transition-all text-xs text-warning hover:bg-warning/10",
                  location.pathname === "/admin" && "bg-warning/10"
                )}
              >
                <Shield className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="font-medium">Admin</span>}
              </Link>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={forceSync}
                  disabled={isSyncing}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <RefreshCcw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {isSyncing ? "Atualizando..." : "Atualizar dados"}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* User card — compact identity block */}
          {!isCollapsed ? (
            <div className="rounded-lg border border-border/30 bg-muted/20 px-2.5 py-2 space-y-1.5">
              {/* Row 1: Avatar circle + name/role + theme toggle */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                  userRole === 'super_admin' ? 'bg-warning/20 text-warning' :
                  userRole === 'diretor' ? 'bg-amber-400/20 text-amber-400' :
                  userRole === 'gerente' ? 'bg-blue-400/20 text-blue-400' :
                  userRole === 'closer' ? 'bg-green-400/20 text-green-400' :
                  'bg-muted text-muted-foreground'
                )}>
                  {user?.email?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">{user?.email}</p>
                  {userRole && (
                    <p className={cn(
                      "text-[10px] font-semibold leading-tight",
                      userRole === 'super_admin' ? 'text-warning' :
                      userRole === 'diretor' ? 'text-amber-400' :
                      userRole === 'gerente' ? 'text-blue-400' :
                      userRole === 'closer' ? 'text-green-400' :
                      'text-muted-foreground'
                    )}>
                      {userRole === 'super_admin' ? 'Super Admin' :
                       userRole === 'diretor' ? 'Diretor' :
                       userRole === 'gerente' ? 'Gerente' :
                       userRole === 'closer' ? 'Closer' :
                       userRole === 'admin' ? 'Admin' : 'Usuário'}
                    </p>
                  )}
                </div>
                <ThemeToggle />
              </div>

              {/* Row 2: Action buttons inline */}
              <div className="flex items-center gap-1">
                {onResetOnboarding && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onResetOnboarding}
                    className="flex-1 text-muted-foreground hover:text-primary hover:bg-primary/10 text-[10px] h-6 px-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Tour
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[10px] h-6 px-2"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sair
                </Button>
              </div>
            </div>
          ) : (
            /* Collapsed: just icons stacked */
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <ThemeToggle />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Sair</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
