import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Kanban,
  Sparkles, LogOut, Shield, Headset, RotateCcw, Presentation,
  BarChart3, Settings, TrendingUp, Megaphone, Bot, Repeat, Route,
  Zap, FileText, DollarSign, Clock, Target, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  moduleKey?: string;
}

const menuItems: MenuItem[] = [
  { title: "Sol Estrateg.IA", icon: Presentation, path: "/", moduleKey: "conferencia" },
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard", moduleKey: "dashboard" },
  { title: "Pipeline", icon: Kanban, path: "/pipeline", moduleKey: "pipeline" },
  { title: "Performance", icon: TrendingUp, path: "/performance", moduleKey: "vendedores" },
  { title: "Painel Comercial", icon: Zap, path: "/painel-comercial" },
  { title: "Monitor de SLA", icon: Clock, path: "/sla" },
  { title: "Robô SOL", icon: Bot, path: "/robo-sol", moduleKey: "bi" },
  { title: "FUP Frio", icon: Repeat, path: "/robo-fup-frio", moduleKey: "bi" },
  { title: "Analista Follow-up", icon: Target, path: "/followup" },
  { title: "Ads Performance", icon: Megaphone, path: "/ads-performance", moduleKey: "bi" },
  { title: "Mídia × Receita", icon: DollarSign, path: "/midia" },
  { title: "BI", icon: BarChart3, path: "/bi", moduleKey: "bi" },
  { title: "Jornada Lead", icon: Route, path: "/jornada-lead", moduleKey: "bi" },
  { title: "Leads", icon: Users, path: "/leads" },
  { title: "Chamados", icon: Headset, path: "/chamados", moduleKey: "chamados" },
  { title: "Reports", icon: FileText, path: "/reports" },
  { title: "Operações", icon: Settings, path: "/operacoes", moduleKey: "monitoramento" },
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

  const visibleItems = menuItems.filter((item) =>
    item.moduleKey ? hasAccess(item.moduleKey) : true
  );

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border/50 flex flex-col",
        isMobile
          ? "w-full"
          : "fixed left-0 top-0 z-50 w-60"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shrink-0">
            <span className="text-base font-black text-primary-foreground tracking-tighter">S</span>
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-warning animate-pulse" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-black tracking-tight text-foreground">Sol Estrateg.IA</h1>
            <p className="text-[10px] text-muted-foreground truncate">BI, CRM e Suporte</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-1.5 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all text-xs",
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
      </nav>

      {/* Footer */}
      <div className="p-1.5 border-t border-border/50 space-y-1">
        {userRole === "super_admin" && (
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
        )}

        <div className="flex items-center px-2.5">
          <ThemeToggle />
        </div>

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

        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-7"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-1.5">Sair</span>
        </Button>
      </div>
    </aside>
  );
}