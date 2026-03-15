import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Menu } from "lucide-react";
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
      {!isMobile && <Sidebar onResetOnboarding={() => setShowOnboarding(true)} />}

      {/* Mobile sidebar sheet */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onResetOnboarding={() => setShowOnboarding(true)} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <main className={isMobile ? "" : "ml-16 lg:ml-64 transition-all duration-300"}>
        {children}
      </main>
      {checked && (
        <OnboardingModal
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
