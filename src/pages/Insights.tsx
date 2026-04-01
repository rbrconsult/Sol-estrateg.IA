import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight, Info } from "lucide-react";
import { skillCategories, statusConfig, type SkillStatus } from "@/data/skillsMap";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const statusFilters: { value: SkillStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "ativo", label: "✅ Ativas" },
  { value: "precisa_dados", label: "⏳ Precisa Dados" },
  { value: "criar", label: "🔨 Criar" },
  { value: "futuro", label: "🔮 Futuro" },
];

export default function Insights() {
  const [statusFilter, setStatusFilter] = useState<SkillStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(skillCategories.map(c => [c.key, true]))
  );

  const totals = useMemo(() => {
    const all = skillCategories.flatMap(c => c.skills);
    return {
      total: all.length,
      ativo: all.filter(s => s.status === "ativo").length,
      precisa_dados: all.filter(s => s.status === "precisa_dados").length,
      criar: all.filter(s => s.status === "criar").length,
      futuro: all.filter(s => s.status === "futuro").length,
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return skillCategories.map(cat => ({
      ...cat,
      skills: cat.skills.filter(s => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (q && !s.name.toLowerCase().includes(q) && !s.desc.toLowerCase().includes(q) && !s.id.includes(q)) return false;
        return true;
      }),
    })).filter(cat => cat.skills.length > 0);
  }, [statusFilter, search]);

  const toggleCat = (key: string) =>
    setOpenCats(prev => ({ ...prev, [key]: !prev[key] }));

  const pctAtivo = Math.round((totals.ativo / totals.total) * 100);

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mapa de Skills</h1>
        <p className="text-muted-foreground mt-1">
          {totals.total} automações inteligentes — Template RBR Scale
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{totals.total}</p>
            <p className="text-xs text-muted-foreground">Total Skills</p>
          </CardContent>
        </Card>
        {(["ativo", "precisa_dados", "criar", "futuro"] as SkillStatus[]).map(st => {
          const cfg = statusConfig[st];
          return (
            <Card key={st} className="bg-card/60 border-border/40">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{totals[st]}</p>
                <Badge variant="outline" className={`${cfg.className} text-[10px] mt-1`}>{cfg.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress */}
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso de Ativação</span>
            <span className="text-sm font-bold text-primary">{pctAtivo}% ({totals.ativo}/{totals.total})</span>
          </div>
          <Progress value={pctAtivo} className="h-2" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <TabsList>
            {statusFilters.map(f => (
              <TabsTrigger key={f.value} value={f.value} className="text-xs">
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Categories */}
      <TooltipProvider>
        {filteredCategories.map(cat => {
          const isOpen = openCats[cat.key] !== false;
          const catActive = cat.skills.filter(s => s.status === "ativo").length;
          return (
            <Collapsible key={cat.key} open={isOpen} onOpenChange={() => toggleCat(cat.key)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between py-2 px-1 hover:bg-secondary/30 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="text-lg">{cat.emoji}</span>
                    <h2 className="text-sm font-semibold">{cat.label}</h2>
                    <Badge variant="outline" className="text-[10px]">
                      {cat.skills.length} skills
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {catActive > 0 && (
                      <Badge variant="outline" className={statusConfig.ativo.className + " text-[10px]"}>
                        {catActive} ativas
                      </Badge>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-2 mb-4">
                  {cat.skills.map(skill => {
                    const cfg = statusConfig[skill.status];
                    return (
                      <Card key={skill.id} className="bg-card/60 border-border/40 hover:border-primary/30 transition-colors">
                        <CardHeader className="pb-2 pt-4 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs text-muted-foreground font-mono">{skill.id}</span>
                            <Badge variant="outline" className={`${cfg.className} text-[10px] shrink-0`}>{cfg.label}</Badge>
                          </div>
                          <CardTitle className="text-sm mt-1 leading-tight">{skill.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2">
                          <p className="text-xs text-muted-foreground leading-relaxed">{skill.desc}</p>
                          {(skill.fonte || skill.output) && (
                            <div className="flex items-center gap-1">
                              {skill.fonte && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                      <Info className="h-3 w-3" />
                                      <span>Fonte</span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <p className="text-xs"><strong>Fonte:</strong> {skill.fonte}</p>
                                    {skill.output && <p className="text-xs mt-1"><strong>Output:</strong> {skill.output}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </TooltipProvider>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma skill encontrada com os filtros aplicados.
        </div>
      )}
    </div>
  );
}
