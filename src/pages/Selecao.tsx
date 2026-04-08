import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Globe, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrgFilter } from "@/contexts/OrgFilterContext";

export default function Selecao() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { orgs, setSelectedOrgId, loading } = useOrgFilter();
  const isSuperAdmin = userRole === "super_admin";

  // Non-super admins skip straight to dashboard
  useEffect(() => {
    if (!isSuperAdmin) navigate("/dashboard", { replace: true });
  }, [isSuperAdmin, navigate]);

  const [particles] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }))
  );

  const handleSelect = (orgId: string | null) => {
    setSelectedOrgId(orgId);
    navigate("/dashboard");
  };

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary/10"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `sel-float ${p.speed}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)), transparent)",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            animation: "sel-pulse 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-10 animate-fade-in">
        <Sparkles className="h-6 w-6 text-primary mx-auto mb-4 opacity-60" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
          Selecione o Ambiente
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Escolha qual visão deseja acessar
        </p>
      </div>

      {loading ? (
        <div className="relative z-10 text-muted-foreground text-sm animate-pulse">
          Carregando filiais...
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 px-6 max-w-xl">
          {/* Global */}
          <button
            onClick={() => handleSelect(null)}
            className="flex flex-col items-center gap-3 w-full py-12 px-8 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-lg transition-all duration-300 group border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-all">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">Global</span>
            <span className="text-xs text-muted-foreground">Todas as filiais</span>
          </button>

          {/* Each org */}
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelect(org.id)}
              className="flex flex-col items-center gap-3 w-full py-12 px-8 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-lg transition-all duration-300 group border-border hover:border-warning/50 hover:shadow-xl hover:shadow-warning/5 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/10 group-hover:bg-warning/20 transition-all">
                <Building2 className="h-8 w-8 text-warning" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.slug}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes sel-float {
          from { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          to { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
        }
        @keyframes sel-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.07; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.12; }
        }
      `}</style>
    </div>
  );
}
