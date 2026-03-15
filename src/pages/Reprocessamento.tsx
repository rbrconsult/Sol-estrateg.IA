import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RotateCcw, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function Reprocessamento() {
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ numero: string; status: string; timestamp: Date }[]>([]);

  const WEBHOOK_URL = "https://hook.us2.make.com/wkesyljs4735mb4vwoo5v033ni9eirho";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleaned = numero.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) {
      toast.error("Informe um número válido com DDD (ex: 5511975456644)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: cleaned }),
      });

      if (res.ok) {
        toast.success(`Reprocessamento enviado para ${cleaned}`);
        setHistory((prev) => [{ numero: cleaned, status: "Enviado", timestamp: new Date() }, ...prev]);
        setNumero("");
      } else {
        toast.error(`Erro ao enviar: ${res.status}`);
        setHistory((prev) => [{ numero: cleaned, status: "Erro", timestamp: new Date() }, ...prev]);
      }
    } catch (err) {
      toast.error("Falha na conexão com o webhook");
      setHistory((prev) => [{ numero: cleaned, status: "Erro", timestamp: new Date() }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-primary" />
          Reprocessamento
        </h1>
        <p className="text-muted-foreground mt-1">Envie um número para reprocessamento via webhook</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enviar Número</CardTitle>
            <CardDescription>Informe o número com código do país e DDD</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número do WhatsApp</Label>
                <Input
                  id="numero"
                  placeholder="5511975456644"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Formato: código país + DDD + número (ex: 5511975456644)</p>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Enviar para Reprocessamento</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico da Sessão</CardTitle>
            <CardDescription>Últimos envios realizados nesta sessão</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum envio realizado ainda</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.numero}</p>
                      <p className="text-xs text-muted-foreground">{item.timestamp.toLocaleTimeString("pt-BR")}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.status === "Enviado" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                      {item.status === "Enviado" && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
