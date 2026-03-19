import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Search, HandCoins, LogOut, ArrowLeft, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { title: "Pré-venda", icon: Search, path: "/solarmarket" },
  { title: "Comercial", icon: HandCoins, path: "/solarmarket/comercial" },
];

export function SolarLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col bg-card border-r border-border/50">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border/30">
        <Sun className="h-5 w-5 text-amber-500" />
        <span className="font-bold text-sm tracking-tight">SOLAR MARKET</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {menuItems.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/30 p-3 space-y-2">
        <button
          onClick={() => navigate("/selecao")}
          className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Trocar ambiente
        </button>
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
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

      {!isMobile && <div className="fixed inset-y-0 left-0 w-60 z-40">{sidebar}</div>}

      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">{sidebar}</SheetContent>
        </Sheet>
      )}

      <main className={cn("transition-all duration-300", isMobile ? "" : "ml-60")}>
        {children}
      </main>
    </div>
  );
}
