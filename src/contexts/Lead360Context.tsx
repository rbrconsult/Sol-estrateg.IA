import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Proposal } from "@/data/dataAdapter";

interface Lead360ContextType {
  isOpen: boolean;
  proposal: Proposal | null;
  openLead360: (proposal: Proposal) => void;
  closeLead360: () => void;
}

const Lead360Context = createContext<Lead360ContextType | null>(null);

export function Lead360Provider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  const openLead360 = useCallback((p: Proposal) => {
    setProposal(p);
    setIsOpen(true);
  }, []);

  const closeLead360 = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setProposal(null), 300);
  }, []);

  return (
    <Lead360Context.Provider value={{ isOpen, proposal, openLead360, closeLead360 }}>
      {children}
    </Lead360Context.Provider>
  );
}

export function useLead360() {
  const ctx = useContext(Lead360Context);
  if (!ctx) throw new Error("useLead360 must be used within Lead360Provider");
  return ctx;
}
