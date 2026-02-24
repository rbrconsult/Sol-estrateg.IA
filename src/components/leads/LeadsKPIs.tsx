import { Users, UserCheck, UserX, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Lead } from "@/data/leadsMockData";

interface Props {
  leads: Lead[];
}

export function LeadsKPIs({ leads }: Props) {
  const total = leads.length;
  const qualificados = leads.filter((l) => l.status === "qualificado").length;
  const desqualificados = leads.filter((l) => l.status === "desqualificado").length;
  const taxa = total > 0 ? ((qualificados / total) * 100).toFixed(1) : "0";

  const cards = [
    { label: "Total de Leads", value: total, icon: Users, color: "text-primary" },
    { label: "Qualificados", value: qualificados, icon: UserCheck, color: "text-emerald-500" },
    { label: "Desqualificados", value: desqualificados, icon: UserX, color: "text-destructive" },
    { label: "Taxa de Qualificação", value: `${taxa}%`, icon: Percent, color: "text-warning" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="relative overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-secondary ${c.color}`}>
              <c.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
