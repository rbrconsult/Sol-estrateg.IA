import { useMemo } from "react";
import { Proposal } from "@/data/dataAdapter";
import { ProjectCard } from "./ProjectCard";
import { useLead360 } from "@/contexts/Lead360Context";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface KanbanBoardProps {
  proposals: Proposal[];
}

// Ordem das colunas do Kanban
const KANBAN_COLUMNS = [
  'TRAFEGO PAGO',
  'PROSPECÇÃO',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO'
];

const columnColors: Record<string, string> = {
  'TRAFEGO PAGO': 'bg-blue-500/20 border-blue-500/50',
  'PROSPECÇÃO': 'bg-indigo-500/20 border-indigo-500/50',
  'QUALIFICAÇÃO': 'bg-cyan-500/20 border-cyan-500/50',
  'QUALIFICADO': 'bg-teal-500/20 border-teal-500/50',
  'CONTATO REALIZADO': 'bg-emerald-500/20 border-emerald-500/50',
  'PROPOSTA': 'bg-green-500/20 border-green-500/50',
  'NEGOCIAÇÃO': 'bg-lime-500/20 border-lime-500/50'
};

export function KanbanBoard({ proposals }: KanbanBoardProps) {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Agrupa propostas por etapa
  const proposalsByStage = useMemo(() => {
    const grouped: Record<string, Proposal[]> = {};
    
    KANBAN_COLUMNS.forEach(col => {
      grouped[col] = [];
    });
    
    proposals.forEach(proposal => {
      const stage = proposal.etapa || 'TRAFEGO PAGO';
      if (grouped[stage]) {
        grouped[stage].push(proposal);
      } else {
        // Se a etapa não estiver no KANBAN_COLUMNS, adiciona ao primeiro
        grouped['TRAFEGO PAGO'].push(proposal);
      }
    });
    
    return grouped;
  }, [proposals]);

  const handleCardClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnProposals = proposalsByStage[column] || [];
            const totalValue = columnProposals.reduce((acc, p) => acc + p.valorProposta, 0);
            const totalPower = columnProposals.reduce((acc, p) => acc + p.potenciaSistema, 0);

            return (
              <div
                key={column}
                className="flex-shrink-0 w-[300px]"
              >
                {/* Column Header */}
                <div className={`rounded-t-lg border-t-4 ${columnColors[column]} bg-card p-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">{column}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {columnProposals.length}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    <span>{formatCurrency(totalValue)}</span>
                    <span>•</span>
                    <span>{totalPower.toFixed(1)} kWp</span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="rounded-b-lg border border-t-0 border-border bg-muted/20 p-2 min-h-[500px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  <div className="space-y-2">
                    {columnProposals.map((proposal) => (
                      <ProjectCard
                        key={proposal.id}
                        proposal={proposal}
                        onClick={() => handleCardClick(proposal)}
                      />
                    ))}
                    {columnProposals.length === 0 && (
                      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                        Nenhum projeto
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <ProjectDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        proposal={selectedProposal}
      />
    </>
  );
}
