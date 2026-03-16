import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Kanban, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Shield,
  Headset,
  RotateCcw,
  Presentation,
  BarChart3,
  Settings,
  TrendingUp,
  Megaphone,
  Bot,
  Repeat,
  Route
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { 
    title: "Sol Estrateg.IA", 
    icon: Presentation, 
    path: "/",
    description: "Painel SOL SDR"
  },
  { 
    title: "Dashboard", 
    icon: LayoutDashboard, 
    path: "/dashboard",
    description: "Painel Executivo"
  },
  { 
    title: "Pipeline", 
    icon: Kanban, 
    path: "/pipeline",
    description: "Kanban & Forecast"
  },
  { 
    title: "Performance", 
    icon: TrendingUp, 
    path: "/performance",
    description: "Vendedores, Perdas & Origens"
  },
  { 
    title: "Chamados", 
    icon: Headset, 
    path: "/chamados",
    description: "Suporte & SLA"
  },
  { 
    title: "BI", 
    icon: BarChart3, 
    path: "/bi",
    description: "Centro de Inteligência"
  },
  { 
    title: "Operações", 
    icon: Settings, 
    path: "/operacoes",
    description: "Monitor & Automações"
  },
];

interface SidebarProps {
  onResetOnboarding?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ onResetOnboarding, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user, userRole } = useAuth();
  const { hasAccess } = useModulePermissions();
  const isMobile = useIsMobile();

  // On mobile inside sheet, always expanded
  const isCollapsed = isMobile ? false : collapsed;

  const pathToModule: Record<string, string> = {
    '/': 'conferencia',
    '/dashboard': 'dashboard',
    '/pipeline': 'pipeline',
    '/performance': 'vendedores',
    '/chamados': 'chamados',
    '/bi': 'bi',
    '/operacoes': 'monitoramento',
  };

  const visibleMenuItems = menuItems.filter(item => {
    const moduleKey = pathToModule[item.path];
    return moduleKey ? hasAccess(moduleKey) : true;
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-card border-r border-border/50 flex flex-col",
        isMobile 
          ? "w-full" 
          : cn("fixed left-0 top-0 z-50 transition-all duration-300", isCollapsed ? "w-16" : "w-64")
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shrink-0">
              <span className="text-lg font-black text-primary-foreground tracking-tighter">S</span>
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-warning animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-black tracking-tight text-foreground">Sol Estrateg.IA</h1>
                <p className="text-xs text-muted-foreground truncate">BI, CRM e Suporte</p>
              </div>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 shrink-0 hover:bg-primary/10"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "animate-pulse")} />
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-medium text-sm">{item.title}</span>
                  <p className={cn(
                    "text-xs truncate",
                    isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </p>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border/50 space-y-2">

        {userRole === 'super_admin' && (
          <Link
            to="/admin"
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-warning hover:bg-warning/10",
              location.pathname === '/admin' && "bg-warning/10"
            )}
          >
            <Shield className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Admin</span>}
          </Link>
        )}

        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "px-3")}>
          <ThemeToggle />
        </div>

        {!isCollapsed && (
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {userRole === 'super_admin' && (
              <p className="text-xs text-warning font-semibold">Super Admin</p>
            )}
          </div>
        )}

        {!isCollapsed && onResetOnboarding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetOnboarding}
            className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10 justify-start"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refazer Tour
          </Button>
        )}

        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          onClick={handleSignOut}
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            isCollapsed && "px-0"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
