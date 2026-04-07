import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { OrgFilterProvider } from "@/contexts/OrgFilterContext";
import { GlobalFilterProvider } from "@/contexts/GlobalFilterContext";
import { Lead360Provider } from "@/contexts/Lead360Context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OrgFilterProvider>
            <GlobalFilterProvider>
              <Lead360Provider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  {children}
                </TooltipProvider>
              </Lead360Provider>
            </GlobalFilterProvider>
          </OrgFilterProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
