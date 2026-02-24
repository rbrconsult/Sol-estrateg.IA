import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

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
      <Sidebar onResetOnboarding={() => setShowOnboarding(true)} />
      <main className="ml-16 lg:ml-64 transition-all duration-300">
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
