import { startOfDay, startOfMonth, startOfYear, subDays } from "date-fns";

export interface FilterConfig {
  showPeriodo?: boolean;
  showCanal?: boolean;
  showTemperatura?: boolean;
  showSearch?: boolean;
  showEtapa?: boolean;
  showStatus?: boolean;
  canais?: string[];
  etapas?: string[];
  statuses?: string[];
  searchPlaceholder?: string;
}

export interface FilterState {
  periodo: string;
  dateFrom?: Date;
  dateTo?: Date;
  canal: string;
  temperatura: string;
  searchTerm: string;
  etapa: string;
  status: string;
}

export type FilterableRecord = {
  data_envio?: string;
  ts_cadastro?: string;
  ts_ultima_interacao?: string;
  ts_qualificado?: string;
  ts_cadastro_projeto?: string;
  synced_at?: string;
  cidade?: string;
  nome?: string;
  telefone?: string;
  email?: string;
  closer_nome?: string;
  identificador?: string;
  project_id?: string;
  makeTemperatura?: string;
  temperatura?: string;
  canalOrigem?: string;
  canal_origem?: string;
  makeStatus?: string;
  status?: string;
  etapaFunil?: string;
  etapa_funil?: string;
};

export type FilterableProposal = {
  dataCriacaoProposta?: string;
  ultimaAtualizacao?: string;
  dataCriacaoProjeto?: string;
  nomeCliente?: string;
  representante?: string;
  responsavel?: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  projetoId?: string;
  etiquetas?: string;
  origemLead?: string;
  faseSM?: string;
  temperatura?: string;
  etapa?: string;
  status?: string;
};

export const DEFAULT_GLOBAL_FILTER_STATE: FilterState = {
  periodo: "mes",
  canal: "todos",
  temperatura: "todas",
  searchTerm: "",
  etapa: "todas",
  status: "todos",
};

export function normalizeFilterValue(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function normalizeStatusValue(value: string | null | undefined): string {
  const normalized = normalizeFilterValue(value);
  if (["OPEN", "ABERTO", "ABERTOS"].includes(normalized)) return "ABERTO";
  if (["WON", "GANHO", "GANHOS", "VENDA", "FECHADO"].includes(normalized)) return "GANHO";
  if (["LOST", "PERDIDO", "PERDIDOS", "PERDA", "DECLINIO", "DECLINIO"].includes(normalized)) return "PERDIDO";
  if (["EXCLUIDO", "EXCLUIDOS"].includes(normalized)) return "EXCLUIDO";
  return normalized;
}

export function parseDateFlexible(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  if (!raw) return null;

  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;

  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!br) return null;

  const [, dd, mm, yyyy, hh = "00", mi = "00", ss = "00"] = br;
  const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getEffectiveDateRange(filters: FilterState): { from: Date | undefined; to: Date | undefined } {
  const today = new Date();
  const todayStart = startOfDay(today);

  switch (filters.periodo) {
    case "custom":
      return { from: filters.dateFrom, to: filters.dateTo };
    case "hoje":
      return { from: todayStart, to: today };
    case "3d":
      return { from: startOfDay(subDays(today, 3)), to: today };
    case "7d":
      return { from: startOfDay(subDays(today, 7)), to: today };
    case "30d":
      return { from: startOfDay(subDays(today, 30)), to: today };
    case "90d":
      return { from: startOfDay(subDays(today, 90)), to: today };
    case "mes":
      return { from: startOfDay(startOfMonth(today)), to: today };
    case "mesAnterior": {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: startOfDay(lastMonth), to: lastMonthEnd };
    }
    case "ano":
    case "ytd":
      return { from: startOfDay(startOfYear(today)), to: today };
    default:
      return { from: undefined, to: undefined };
  }
}

function hasDateFilter(range: { from: Date | undefined; to: Date | undefined }) {
  return Boolean(range.from || range.to);
}

function matchesDateRange(date: Date | null, range: { from: Date | undefined; to: Date | undefined }) {
  if (!hasDateFilter(range)) return true;
  if (!date) return false;

  if (range.from) {
    const fromStart = new Date(range.from);
    fromStart.setHours(0, 0, 0, 0);
    if (date < fromStart) return false;
  }

  if (range.to) {
    const toEnd = new Date(range.to);
    toEnd.setHours(23, 59, 59, 999);
    if (date > toEnd) return false;
  }

  return true;
}

function includesNormalized(haystack: string | null | undefined, needle: string) {
  return normalizeFilterValue(haystack).includes(needle);
}

function matchesSearch(fields: Array<string | null | undefined>, searchTerm: string) {
  if (!searchTerm) return true;
  return fields.some((field) => includesNormalized(field, searchTerm));
}

function extractRecordDate(record: FilterableRecord): Date | null {
  return (
    parseDateFlexible(record.data_envio) ||
    parseDateFlexible(record.ts_cadastro) ||
    parseDateFlexible(record.ts_ultima_interacao) ||
    parseDateFlexible(record.ts_qualificado) ||
    parseDateFlexible(record.synced_at) ||
    parseDateFlexible(record.ts_cadastro_projeto)
  );
}

function extractProposalDate(proposal: FilterableProposal): Date | null {
  return (
    parseDateFlexible(proposal.dataCriacaoProjeto) ||
    parseDateFlexible(proposal.dataCriacaoProposta) ||
    parseDateFlexible(proposal.ultimaAtualizacao)
  );
}

export function filterRecordsByGlobalFilters<T extends FilterableRecord>(
  records: T[],
  filters: FilterState,
  effectiveDateRange = getEffectiveDateRange(filters),
): T[] {
  const searchTerm = normalizeFilterValue(filters.searchTerm);
  const canalFilter = normalizeFilterValue(filters.canal);
  const etapaFilter = normalizeFilterValue(filters.etapa);
  const statusFilter = normalizeStatusValue(filters.status);
  const temperaturaFilter = normalizeFilterValue(filters.temperatura);

  return records.filter((record) => {
    if (!matchesDateRange(extractRecordDate(record), effectiveDateRange)) return false;

    const canal = record.canalOrigem || record.canal_origem || "";
    const temperatura = record.makeTemperatura || record.temperatura || "";
    const etapa = record.etapaFunil || record.etapa_funil || "";
    const status = record.makeStatus || record.status || "";

    if (filters.canal !== "todos" && normalizeFilterValue(canal) !== canalFilter) return false;
    if (filters.temperatura !== "todas" && normalizeFilterValue(temperatura) !== temperaturaFilter) return false;
    if (filters.etapa !== "todas" && normalizeFilterValue(etapa) !== etapaFilter) return false;
    if (filters.status !== "todos" && normalizeStatusValue(status) !== statusFilter) return false;

    if (!matchesSearch([
      record.nome,
      record.telefone,
      record.email,
      record.cidade,
      record.closer_nome,
      record.identificador,
      record.project_id,
      canal,
      etapa,
      status,
    ], searchTerm)) {
      return false;
    }

    return true;
  });
}

export function filterProposalsByGlobalFilters<T extends FilterableProposal>(
  proposals: T[],
  filters: FilterState,
  effectiveDateRange = getEffectiveDateRange(filters),
): T[] {
  const searchTerm = normalizeFilterValue(filters.searchTerm);
  const etapaFilter = normalizeFilterValue(filters.etapa);
  const statusFilter = normalizeStatusValue(filters.status);
  const temperaturaFilter = normalizeFilterValue(filters.temperatura);

  return proposals.filter((proposal) => {
    if (!matchesDateRange(extractProposalDate(proposal), effectiveDateRange)) return false;

    if (filters.temperatura !== "todas" && normalizeFilterValue(proposal.temperatura) !== temperaturaFilter) return false;
    if (filters.etapa !== "todas" && normalizeFilterValue(proposal.etapa) !== etapaFilter) return false;
    if (filters.status !== "todos" && normalizeStatusValue(proposal.status) !== statusFilter) return false;

    if (!matchesSearch([
      proposal.nomeCliente,
      proposal.representante,
      proposal.responsavel,
      proposal.clienteTelefone,
      proposal.clienteEmail,
      proposal.projetoId,
      proposal.etiquetas,
      proposal.origemLead,
      proposal.faseSM,
      proposal.etapa,
      proposal.status,
    ], searchTerm)) {
      return false;
    }

    return true;
  });
}
