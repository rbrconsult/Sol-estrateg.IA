import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Kanban, 
  TrendingUp, 
  Activity, 
  Users, 
  XCircle, 
  Target,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const menuItems = [
  { 
    title: "Dashboard", 
    icon: LayoutDashboard, 
    path: "/",
    description: "Painel Executivo"
  },
  { 
    title: "Pipeline", 
    icon: Kanban, 
    path: "/pipeline",
    description: "Kanban Visual"
  },
  { 
    title: "Forecast", 
    icon: TrendingUp, 
    path: "/forecast",
    description: "Previsão de Receita"
  },
  { 
    title: "Atividades", 
    icon: Activity, 
    path: "/atividades",
    description: "Follow-ups"
  },
  { 
    title: "Vendedores", 
    icon: Users, 
    path: "/vendedores",
    description: "Performance"
  },
  { 
    title: "Perdas", 
    icon: XCircle, 
    path: "/perdas",
    description: "Análise de Perdas"
  },
  { 
    title: "Origens", 
    icon: Target, 
    path: "/origens",
    description: "Origem dos Leads"
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user, userRole } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-card border-r border-border/50 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shrink-0">
            <span className="text-lg font-black text-primary-foreground tracking-tighter">E</span>
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-warning animate-pulse" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-black tracking-tight text-foreground">EVOLVE</h1>
              <p className="text-xs text-muted-foreground truncate">CRM Solar</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "animate-pulse")} />
              {!collapsed && (
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
        {/* Admin Link */}
        {userRole === 'super_admin' && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-warning hover:bg-warning/10",
              location.pathname === '/admin' && "bg-warning/10"
            )}
          >
            <Shield className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Admin</span>}
          </Link>
        )}

        {/* Theme Toggle */}
        <div className={cn("flex items-center", collapsed ? "justify-center" : "px-3")}>
          <ThemeToggle />
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {userRole === 'super_admin' && (
              <p className="text-xs text-warning font-semibold">Super Admin</p>
            )}
          </div>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={handleSignOut}
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "px-0"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
