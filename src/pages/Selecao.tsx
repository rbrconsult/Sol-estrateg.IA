import { useNavigate } from "react-router-dom";
import { Sun, BarChart3 } from "lucide-react";

export default function Selecao() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <h1 className="text-2xl font-bold text-foreground mb-2">Bem-vindo</h1>
      <p className="text-muted-foreground mb-10 text-sm">Selecione o ambiente que deseja acessar</p>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* SOLAR MARKET */}
        <button
          onClick={() => navigate("/solar")}
          className="group relative flex flex-col items-center justify-center gap-4 w-64 h-48 rounded-2xl border border-border bg-card hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
            <Sun className="h-7 w-7" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">SOLAR MARKET</span>
          <span className="text-xs text-muted-foreground">Pré-venda & Comercial</span>
        </button>

        {/* SOL.estrategia */}
        <button
          onClick={() => navigate("/")}
          className="group relative flex flex-col items-center justify-center gap-4 w-64 h-48 rounded-2xl border border-border bg-card hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <BarChart3 className="h-7 w-7" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">SOL.estrateg<span className="text-primary">IA</span></span>
          <span className="text-xs text-muted-foreground">Inteligência & Operações</span>
        </button>
      </div>
    </div>
  );
}
