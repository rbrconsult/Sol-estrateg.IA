import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Kanban,
  Sparkles, LogOut, Shield, Headset, RotateCcw, Presentation,
  BarChart3, TrendingUp, Megaphone, Bot, Repeat, Route,
  Zap, FileText, DollarSign, Clock, Target, Users,
  FileCheck, Handshake, Percent,
  Activity, RefreshCw, Eraser, Building2, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  moduleKey?: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Pré-venda",
    items: [
      { title: "Dashboard", icon: Presentation, path: "/conferencia", moduleKey: "conferencia" },
      { title: "Pipeline", icon: Kanban, path: "/pipeline", moduleKey: "pipeline" },
      { title: "Leads", icon: Users, path: "/leads" },
      { title: "Robô SOL", icon: Bot, path: "/robo-sol", moduleKey: "bi" },
      { title: "FUP Frio", icon: Repeat, path: "/robo-fup-frio", moduleKey: "bi" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { title: "Painel Comercial", icon: Zap, path: "/painel-comercial" },
      { title: "Propostas", icon: FileCheck, path: "/forecast", moduleKey: "pipeline" },
      { title: "Contratos", icon: Handshake, path: "/dashboard", moduleKey: "dashboard" },
      { title: "Vendedores", icon: TrendingUp, path: "/performance", moduleKey: "vendedores" },
      { title: "Comissões", icon: Percent, path: "/comissoes" },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { title: "BI", icon: BarChart3, path: "/bi", moduleKey: "bi" },
      { title: "Analista Follow-up", icon: Target, path: "/followup" },
      { title: "Jornada Lead", icon: Route, path: "/jornada-lead", moduleKey: "bi" },
      { title: "Monitor de SLA", icon: Clock, path: "/sla" },
      { title: "Ads Performance", icon: Megaphone, path: "/ads-performance", moduleKey: "bi" },
      { title: "Mídia × Receita", icon: DollarSign, path: "/midia" },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", icon: FileText, path: "/reports" },
    ],
  },
  {
    label: "Operacional",
    items: [
      { title: "Chamados", icon: Headset, path: "/chamados", moduleKey: "chamados" },
      { title: "Monitor", icon: Activity, path: "/operacoes", moduleKey: "monitoramento" },
      { title: "Reprocessar", icon: RefreshCw, path: "/reprocessamento" },
      { title: "Sanitização", icon: Eraser, path: "/sanitizacao" },
    ],
  },
];

interface SidebarProps {
  onResetOnboarding?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ onResetOnboarding, onNavigate }: SidebarProps) {
  const location = useLocation();
  const { signOut, user, userRole } = useAuth();
  const { hasAccess } = useModulePermissions();
  const isMobile = useIsMobile();

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
        <div className="p-1.5 border-t border-border/50 space-y-1">
          {userRole === "super_admin" && (
            isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/admin"
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center justify-center py-1.5 rounded-lg transition-all text-xs text-warning hover:bg-warning/10",
                      location.pathname === "/admin" && "bg-warning/10"
                    )}
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Admin</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/admin"
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-xs text-warning hover:bg-warning/10",
                  location.pathname === "/admin" && "bg-warning/10"
                )}
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span className="font-medium">Admin</span>
              </Link>
            )
          )}

          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "px-2.5")}>
            <ThemeToggle />
          </div>

          {!isCollapsed && (
            <>
              <div className="px-2.5 py-1">
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                {userRole === "super_admin" && (
                  <p className="text-[10px] text-warning font-semibold">Super Admin</p>
                )}
              </div>

              {onResetOnboarding && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResetOnboarding}
                  className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10 justify-start text-xs h-7"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Refazer Tour
                </Button>
              )}
            </>
          )}

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-7",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-1.5">Sair</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
