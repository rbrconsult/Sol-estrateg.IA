import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useSolFunis } from "@/hooks/useSolData";

interface Etapa {
  ordem?: number;
  nome?: string;
  id_sm?: number;
  fase?: string;
}

export default function SolFunisPage() {
  const { data: funis, isLoading } = useSolFunis();

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🔄 Funis SolarMarket</h1>
        <p className="text-sm text-muted-foreground">Etapas do funil sincronizadas com o SolarMarket</p>
      </div>

      {(!funis || funis.length === 0) ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum funil configurado</CardContent></Card>
      ) : funis.map(funil => {
        const etapas: Etapa[] = Array.isArray(funil.etapas) ? funil.etapas : [];
        return (
          <Card key={funil.franquia_id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-3">
                🔄 {funil.funil_nome || "Funil"} (ID {funil.funil_id})
                <Badge variant="outline" className="text-[10px]">Robô SDR: {funil.sm_robo_id || "—"}</Badge>
                <Badge variant="outline" className="text-[10px]">Etiqueta: {funil.sm_etiqueta_robo || "—"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ordem</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-center">ID SM</TableHead>
                    <TableHead>Fase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {etapas.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem etapas</TableCell></TableRow>
                  ) : etapas.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map((e, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{e.ordem ?? i}</TableCell>
                      <TableCell className="font-medium">
                        {e.nome?.includes("Qualificado") ? "★ " : ""}{e.nome || "—"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{e.id_sm || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{e.fase || "—"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground">{etapas.length} etapas no funil {funil.funil_nome}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
