import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, ChevronDown, ChevronRight, Info, Sparkles } from "lucide-react";
import { skillCategories, statusConfig, verticalConfig, type SkillStatus, type Vertical } from "@/data/skillsMap";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSkillToggles } from "@/hooks/useSkillToggles";
import { SkillReportsPanel } from "@/components/skills/SkillReportsPanel";
import { SkillAutoFixPanel } from "@/components/skills/SkillAutoFixPanel";
import { SkillConfigPanel } from "@/components/skills/SkillConfigPanel";
import { skillConfigSchemas } from "@/data/skillConfigSchemas";
import { SkillCreatorForm } from "@/components/skills/SkillCreatorForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusFilters: { value: SkillStatus | "all" | "pendente" | "ligadas"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "ligadas", label: "🟢 Ligadas" },
  { value: "ativo", label: "✅ Ativas" },
  { value: "pendente", label: "⚙️ Pendente" },
  { value: "precisa_dados", label: "⏳ Aguardando Dados" },
  { value: "criar", label: "📝 Rascunho" },
  { value: "futuro", label: "🚀 Em Criação" },
];

const verticalFilters: Vertical[] = ["universal", "solar", "financeiro", "viagens", "seguros", "academia"];

export default function Insights() {
  const [statusFilter, setStatusFilter] = useState<SkillStatus | "all" | "pendente" | "ligadas">("all");
  const [verticalFilter, setVerticalFilter] = useState<Vertical | "all">("solar");
  const [search, setSearch] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(skillCategories.map(c => [c.key, true]))
  );
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const { toggles, toggle } = useSkillToggles();
  const queryClient = useQueryClient();

  // Track which skills have saved config
  const { data: configuredSkills = new Set<string>() } = useQuery({
    queryKey: ["skill-configs-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organization_configs")
        .select("config_key")
        .eq("config_category", "skills")
        .like("config_key", "skill_config_%");
      const set = new Set<string>();
      data?.forEach(r => {
        const id = r.config_key.replace("skill_config_", "");
        set.add(id);
      });
      return set;
    },
    staleTime: 30_000,
  });

  const allSkills = useMemo(() => skillCategories.flatMap(c => c.skills), []);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return skillCategories.map(cat => ({
      ...cat,
      skills: cat.skills.filter(s => {
        if (statusFilter === "ligadas") {
          if (!toggles[s.id]) return false;
        } else if (statusFilter === "pendente") {
          const isOn = !!toggles[s.id];
          const hasPanel = !!skillConfigSchemas[s.id] || s.id === "6.11";
          const isConfigDone = configuredSkills.has(s.id) || s.id === "6.11";
          if (!(isOn && hasPanel && !isConfigDone)) return false;
        } else if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (verticalFilter !== "all") {
          // Show skill if it includes the selected vertical OR is universal
          const isUniversal = s.verticals.includes("universal");
          const matchesFilter = s.verticals.includes(verticalFilter);
          // Hide skills that are EXCLUSIVELY for other verticals (not universal, not matching)
          if (!isUniversal && !matchesFilter) return false;
        }
        if (q && !s.name.toLowerCase().includes(q) && !s.desc.toLowerCase().includes(q) && !s.id.includes(q)) return false;
        return true;
      }),
    })).filter(cat => cat.skills.length > 0);
  }, [statusFilter, verticalFilter, search, toggles, configuredSkills]);

  const visibleSkills = useMemo(() => filteredCategories.flatMap(c => c.skills), [filteredCategories]);

  const totals = useMemo(() => ({
    total: allSkills.length,
    visible: visibleSkills.length,
    ativo: allSkills.filter(s => s.status === "ativo").length,
    precisa_dados: allSkills.filter(s => s.status === "precisa_dados").length,
    criar: allSkills.filter(s => s.status === "criar").length,
    futuro: allSkills.filter(s => s.status === "futuro").length,
    ligadas: allSkills.filter(s => toggles[s.id]).length,
  }), [allSkills, toggles, visibleSkills]);

  const toggleCat = (key: string) =>
    setOpenCats(prev => ({ ...prev, [key]: !prev[key] }));

  const pctLigadas = totals.total > 0 ? Math.round((totals.ligadas / totals.total) * 100) : 0;

  // Vertical counts
  const verticalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    verticalFilters.forEach(v => {
      counts[v] = allSkills.filter(s => s.verticals.includes(v)).length;
    });
    return counts;
  }, [allSkills]);

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mapa de Skills — Scale</h1>
          <p className="text-muted-foreground mt-1">
            {totals.total} automações inteligentes • Template multi-vertical replicável
          </p>
        </div>
        <Dialog open={creatorOpen} onOpenChange={setCreatorOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" /> Criar Skill com IA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Criar Nova Skill
              </DialogTitle>
            </DialogHeader>
            <SkillCreatorForm onSkillCreated={(skill) => {
              toast.success(`Skill "${skill.name}" gerada! Adicione ao código para ativar.`);
              setCreatorOpen(false);
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Vertical selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setVerticalFilter("all")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
            verticalFilter === "all"
              ? "bg-primary/10 border-primary/30 text-primary font-medium"
              : "bg-card/60 border-border/40 text-muted-foreground hover:border-primary/20"
          }`}
        >
          🌐 Todos <span className="text-xs opacity-70">({totals.total})</span>
        </button>
        {verticalFilters.map(v => {
          const vc = verticalConfig[v];
          const isActive = verticalFilter === v;
          return (
            <button
              key={v}
              onClick={() => setVerticalFilter(v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isActive
                  ? `${vc.color} font-medium`
                  : "bg-card/60 border-border/40 text-muted-foreground hover:border-primary/20"
              }`}
            >
              {vc.emoji} {vc.label} <span className="text-xs opacity-70">({verticalCounts[v]})</span>
            </button>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{totals.visible}</p>
            <p className="text-[10px] text-muted-foreground">Visíveis</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-primary/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totals.ligadas}</p>
            <p className="text-[10px] text-muted-foreground">Ligadas</p>
          </CardContent>
        </Card>
        {(["ativo", "precisa_dados", "criar", "futuro"] as SkillStatus[]).map(st => {
          const cfg = statusConfig[st];
          return (
            <Card key={st} className="bg-card/60 border-border/40">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{totals[st]}</p>
                <Badge variant="outline" className={`${cfg.className} text-[9px] mt-0.5`}>{cfg.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activation progress */}
      <Card className="bg-card/60 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Ativação Global</span>
            <span className="text-sm font-bold text-primary">{pctLigadas}% ({totals.ligadas}/{totals.total})</span>
          </div>
          <Progress value={pctLigadas} className="h-2" />
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
          const catLigadas = cat.skills.filter(s => toggles[s.id]).length;
          return (
            <Collapsible key={cat.key} open={isOpen} onOpenChange={() => toggleCat(cat.key)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between py-2 px-1 hover:bg-secondary/30 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="text-lg">{cat.emoji}</span>
                    <h2 className="text-sm font-semibold">{cat.label}</h2>
                    <Badge variant="outline" className="text-[10px]">
                      {cat.skills.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {catLigadas > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        {catLigadas} ligadas
                      </Badge>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-2 mb-4">
                  {cat.skills.map(skill => {
                    const cfg = statusConfig[skill.status];
                    const isOn = !!toggles[skill.id];
                    const hasConfigPanel = skill.id === "6.11" || !!skillConfigSchemas[skill.id];
                    const isConfigured = configuredSkills.has(skill.id) || skill.id === "6.11";
                    const isPendingConfig = isOn && hasConfigPanel && !isConfigured;
                    const isFullyActive = isOn && (!hasConfigPanel || isConfigured);
                    const isExpanded = expandedSkillId === skill.id;

                    const handleSaved = () => {
                      setExpandedSkillId(null);
                      queryClient.invalidateQueries({ queryKey: ["skill-configs-status"] });
                    };

                    return (
                      <Card
                        key={skill.id}
                        className={`border transition-colors cursor-pointer ${
                          isFullyActive ? "bg-card border-primary/40 shadow-sm shadow-primary/5" 
                          : isPendingConfig ? "bg-card border-amber-500/40 shadow-sm shadow-amber-500/5"
                          : "bg-card/40 border-border/40 opacity-75"
                        } ${isExpanded && hasConfigPanel ? "col-span-full" : ""}`}
                        onClick={() => hasConfigPanel && isOn ? setExpandedSkillId(isExpanded ? null : skill.id) : undefined}
                      >
                        <CardHeader className="pb-2 pt-4 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-muted-foreground font-mono">{skill.id}</span>
                              {isOn && (
                                <Badge variant="outline" className="text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold animate-pulse">
                                  🟢 Ligada
                                </Badge>
                              )}
                              <Badge variant="outline" className={`${cfg.className} text-[9px] shrink-0`}>{cfg.label}</Badge>
                              {isPendingConfig && (
                                <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                                  ⚙️ Pendente Config
                                </Badge>
                              )}
                              {isFullyActive && hasConfigPanel && (
                                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  ✅ Configurado
                                </Badge>
                              )}
                              {hasConfigPanel && isOn && (
                                <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                                  {isExpanded ? "▼ Fechar" : "▶ Configurar"}
                                </Badge>
                              )}
                            </div>
                            <Switch
                              checked={isOn}
                              onCheckedChange={(checked) => {
                                toggle({ skillId: skill.id, enabled: checked });
                                if (checked && hasConfigPanel) {
                                  setExpandedSkillId(skill.id);
                                } else if (!checked) {
                                  if (expandedSkillId === skill.id) setExpandedSkillId(null);
                                }
                              }}
                              className="shrink-0"
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                          <CardTitle className="text-sm mt-1 leading-tight">{skill.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3 space-y-2">
                          <p className="text-xs text-muted-foreground leading-relaxed">{skill.desc}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {skill.verticals.filter(v => v !== "universal").map(v => (
                              <Badge key={v} variant="outline" className={`${verticalConfig[v].color} text-[9px]`}>
                                {verticalConfig[v].emoji} {verticalConfig[v].label}
                              </Badge>
                            ))}
                            {skill.verticals.includes("universal") && skill.verticals.length === 1 && (
                              <Badge variant="outline" className="text-[9px] bg-slate-500/10 text-slate-400 border-slate-500/20">
                                🌐 Universal
                              </Badge>
                            )}
                          </div>
                          {(skill.fonte || skill.output) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                  <Info className="h-3 w-3" />
                                  <span>Detalhes</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                {skill.fonte && <p className="text-xs"><strong>Fonte:</strong> {skill.fonte}</p>}
                                {skill.output && <p className="text-xs mt-1"><strong>Output:</strong> {skill.output}</p>}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {/* Inline config panels */}
                          {isOn && isExpanded && (
                            <div className="mt-3 pt-3 border-t border-border/30" onClick={e => e.stopPropagation()}>
                              {skill.id === "6.11" ? <SkillReportsPanel /> : skillConfigSchemas[skill.id] && <SkillConfigPanel schema={skillConfigSchemas[skill.id]} onSaved={handleSaved} />}
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
