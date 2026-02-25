import { AlertTriangle, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import type { Proposal } from "@/data/dataAdapter";

interface Props { leads: Proposal[] }

export function LeadsQuentesAbandonados({ leads }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-base">Leads Quentes Abandonados</CardTitle>
          <Badge variant="destructive" className="ml-auto">{leads.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Temperatura QUENTE + parado há mais de 7 dias</p>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum lead quente abandonado 🎉</p>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-auto">
            {leads.slice(0, 10).map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{l.nomeCliente}</p>
                    <p className="text-xs text-muted-foreground">{l.etapa} · {l.tempoNaEtapa} dias parado</p>
                  </div>
                </div>
                <p className="text-sm font-bold">{formatCurrencyAbbrev(l.valorProposta)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
