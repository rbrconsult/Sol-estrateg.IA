import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Search, HandCoins, LogOut, ArrowLeft, Sun, Menu, BarChart3, Users, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { title: "Pré-venda", icon: Search, path: "/solarmarket/prevenda" },
  { title: "Comercial", icon: HandCoins, path: "/solarmarket/comercial" },
  { title: "Vendedores", icon: Users, path: "/solarmarket/vendedores" },
];

export function SolarLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? "w-16" : "w-52";
  const marginLeft = collapsed ? "ml-16" : "ml-52";

  const sidebar = (
    <div className="flex h-full flex-col bg-card border-r border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-border/30">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
          <Sun className="h-5 w-5 text-amber-500 shrink-0" />
          {!collapsed && <span className="font-bold text-sm tracking-tight">SOLAR MARKET</span>}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {menuItems.map((item) => {
          const active = pathname === item.path;
          const link = (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.title}
            </Link>
          );

          if (collapsed && !isMobile) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="px-2 pb-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("w-full text-muted-foreground hover:text-foreground", collapsed && "px-0 justify-center")}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4 mr-2" />Recolher</>}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/30 p-3 space-y-2">
        {!collapsed && (
          <button
            onClick={() => navigate("/selecao")}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Quero voltar para a SOL
          </button>
        )}
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/selecao")}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Voltar para SOL</TooltipContent>
            </Tooltip>
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={signOut}>
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3">
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {isMobile && (
        <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-border/50 bg-card px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Sun className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold tracking-tight">SOLAR MARKET</span>
        </header>
      )}

      {!isMobile && <div className={cn("fixed inset-y-0 left-0 z-40 transition-all duration-300", sidebarWidth)}>{sidebar}</div>}

      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">{sidebar}</SheetContent>
        </Sheet>
      )}

      <main className={cn("transition-all duration-300", isMobile ? "" : marginLeft)}>
        {children}
      </main>
    </div>
  );
}
