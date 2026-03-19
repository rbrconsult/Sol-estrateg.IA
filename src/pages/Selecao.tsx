import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, BarChart3, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

type Choice = "solar" | "sol" | null;

export default function Selecao() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Choice>(null);
  const [animating, setAnimating] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const handleSelect = useCallback((choice: Choice) => {
    if (animating) return;
    setSelected(choice);
    setAnimating(true);
    setShowMessage(true);

    if (choice === "sol") {
      // Confetti explosion
      const end = Date.now() + 2000;
      const colors = ["hsl(142,76%,36%)", "#ffffff", "hsl(45,93%,47%)", "hsl(199,89%,48%)"];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.7 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      setTimeout(() => navigate("/conferencia"), 2800);
    } else if (choice === "solar") {
      setTimeout(() => navigate("/solar"), 2200);
    }
  }, [animating, navigate]);

  // Floating particles for ambient motion
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }))
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary/10"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `float ${p.speed}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}

      {/* Glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)), transparent)",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            animation: "pulse-glow 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Title */}
      <div className="relative z-10 text-center mb-12 animate-fade-in">
        <Sparkles className="h-6 w-6 text-primary mx-auto mb-4 opacity-60" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
          Decida onde você quer chegar
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Escolha o ambiente que vai transformar seus resultados
        </p>
      </div>

      {/* Cards separados */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-6 px-6">
        {/* SOLAR MARKET */}
        <button
          onClick={() => handleSelect("solar")}
          disabled={animating}
          className={`relative flex flex-col items-center gap-4 w-72 py-12 px-8 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-lg transition-all duration-500 group ${
            selected === "solar"
              ? "border-warning/60 scale-[1.03] shadow-warning/10 shadow-xl"
              : selected === "sol"
              ? "opacity-30 scale-95 border-border"
              : "border-border hover:border-warning/40 hover:shadow-xl hover:shadow-warning/5"
          }`}
        >
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-500 ${
              selected === "solar"
                ? "bg-warning/20 scale-110"
                : "bg-warning/10 group-hover:bg-warning/15"
            }`}
          >
            <Sun className="h-8 w-8 text-warning" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            SOLAR MARKET
          </span>
          <span className="text-xs text-muted-foreground">
            Pré-venda & Comercial
          </span>
        </button>

        {/* SOL.estrategia */}
        <button
          onClick={() => handleSelect("sol")}
          disabled={animating}
          className={`relative flex flex-col items-center gap-4 w-72 py-12 px-8 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-lg transition-all duration-500 group ${
            selected === "sol"
              ? "border-primary/60 scale-[1.03] shadow-primary/10 shadow-xl"
              : selected === "solar"
              ? "opacity-30 scale-95 border-border"
              : "border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
          }`}
        >
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-500 ${
              selected === "sol"
                ? "bg-primary/20 scale-110"
                : "bg-primary/10 group-hover:bg-primary/15"
            }`}
          >
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            SOL.estrateg<span className="text-primary">IA</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Inteligência & Operações
          </span>
        </button>
      </div>

        {/* Animated message */}
        <div
          className={`mt-8 text-center transition-all duration-700 ${
            showMessage
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {selected === "solar" && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-lg font-semibold text-warning">
                ☀️ Mesmas decisões te levam sempre ao mesmo lugar
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o Solar Market...
              </p>
            </div>
          )}
          {selected === "sol" && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-lg font-semibold text-primary">
                🎉 Sua melhor escolha! Parabéns!
              </p>
              <p className="text-sm text-muted-foreground">
                Preparando o SOL.estrateg.IA para você...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSS for ambient animations */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          to { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.07; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.12; }
        }
      `}</style>
    </div>
  );
}
