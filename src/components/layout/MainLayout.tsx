import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Menu, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data && !(data as any).onboarding_completed) {
          setShowOnboarding(true);
        }
        setChecked(true);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      {isMobile && (
        <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-border/50 bg-card px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-bold tracking-tight">Sol Estrateg.IA</span>
        </header>
      )}

      {/* Desktop sidebar */}
      {!isMobile && <Sidebar onResetOnboarding={() => setShowOnboarding(true)} collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />}

      {/* Mobile sidebar sheet */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onResetOnboarding={() => setShowOnboarding(true)} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <main className={isMobile ? "" : cn("transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-60")}>
        {children}
      </main>

      {/* Floating "Novidades" button — bottom right */}
      <Link
        to="/roadmap"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-border/50 bg-card/90 backdrop-blur-sm px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 shadow-sm transition-all"
      >
        <Rocket className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Novidades</span>
      </Link>
      {checked && (
        <OnboardingModal
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
