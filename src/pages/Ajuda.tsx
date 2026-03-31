import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, MessageSquare, BookOpen, Terminal } from "lucide-react";
import SOLConsole from "@/components/ajuda/SOLConsole";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { helpCategories, HelpCategory } from "@/data/helpContent";

export default function Ajuda() {
  const location = useLocation();
  const [selectedId, setSelectedId] = useState(helpCategories[0].id);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && helpCategories.find((c) => c.id === hash)) {
      setSelectedId(hash);
    }
  }, [location.hash]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return helpCategories;
    const q = search.toLowerCase();
    return helpCategories.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.sections.some(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.content.toLowerCase().includes(q)
        )
    );
  }, [search]);

  const selected =
    helpCategories.find((c) => c.id === selectedId) || helpCategories[0];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-foreground">Ajuda</h1>
        <p className="text-sm text-muted-foreground">
          Documentação, guias e simulação de operação
        </p>
      </div>

      <Tabs defaultValue="docs" className="w-full">
        <TabsList>
          <TabsTrigger value="docs" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Documentação
          </TabsTrigger>
          <TabsTrigger value="simulation" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Simular Operação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na documentação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <nav className="space-y-1 pr-2">
                {filteredCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedId(cat.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                        selectedId === cat.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">{cat.title}</span>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>

            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-6 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <selected.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {selected.title}
                  </h2>
                </div>

                {selected.sections.map((section, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {section.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="simulation" className="mt-4">
          <iframe
            src="/simulacao-v4.html"
            className="w-full h-[calc(100vh-12rem)] rounded-lg border border-border"
            title="Simular Operação"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
