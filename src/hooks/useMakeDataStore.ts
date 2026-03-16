import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MakeInteraction {
  tipo: 'enviada' | 'recebida';
  mensagem: string;
  data: string;
}

export interface MakeRecord {
  telefone: string;
  robo: 'sol' | 'fup_frio' | string;
  ultima_mensagem: string;
  data_envio: string;
  status_resposta: 'respondeu' | 'ignorou' | 'aguardando' | string;
  data_resposta?: string;
  historico: MakeInteraction[];
  /** Raw status from Make Data Store (QUALIFICADO, WHATSAPP, DESQUALIFICADO, etc.) */
  makeStatus?: string;
  /** Temperature from Make Data Store */
  makeTemperatura?: string;
  /** Score from Make Data Store */
  makeScore?: string;
  /** Lead name */
  nome?: string;
  /** City */
  cidade?: string;
  /** Monthly bill range */
  valorConta?: string;
  /** Property type */
  imovel?: string;
  /** Email */
  email?: string;
  /** Project ID from CRM */
  projectId?: string;
  /** Follow-up count */
  followupCount?: number;
  /** Last follow-up date */
  lastFollowupDate?: string;
  /** codigo_status from Make (NAO_RESPONDEU, etc.) */
  codigoStatus?: string;
}

interface MakeResponse {
  data: any[];
  count: number;
  lastUpdate: string;
  error?: string;
}

/** Normalize phone: keep only digits, strip leading country code 55 if 12+ digits */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // Brazilian numbers: if starts with 55 and has 12-13 digits, strip country code
  if (digits.length >= 12 && digits.startsWith('55')) {
    return digits.slice(2);
  }
  return digits;
}

/** Parse raw Make Data Store records into typed MakeRecords */
function parseRecords(raw: any[]): MakeRecord[] {
  return raw.map((r) => {
    const d = r.data || r;
    const phone = normalizePhone(String(d.telefone || r.key || ''));
    
    // Determine robot type from available fields
    // Regra simples: followup_count >= 1 → FUP Frio, senão → SOL SDR
    const fupCount = parseInt(d.followup_count) || 0;
    
    let robo = String(d.robo || d.bot || d.tipo_robo || '').toLowerCase();
    if (!robo) {
      robo = fupCount >= 1 ? 'fup_frio' : 'sol';
    }

    // Determine status from available data with heuristics
    let statusResposta = String(d.status_resposta || d.response_status || '').toLowerCase();
    
    // Don't use d.status for response detection — it's a lead status (DESQUALIFICADO, WHATSAPP, etc.)
    const codigoStatus = String(d.codigo_status || '').toUpperCase();

    // Heuristic: detect "respondeu" from multiple signals
    const hasDataResposta = !!(d.data_resposta || d.response_date) && String(d.data_resposta || d.response_date || '').trim() !== '';
    const hasRepliedFlag = !!(d.respondeu || d.replied || d.response);
    const historico = d.historico || d.history;
    const hasReceivedMessage = Array.isArray(historico) && historico.some((h: any) => {
      const tipo = String(h.tipo || h.type || '').toLowerCase();
      return tipo === 'recebida' || tipo === 'received' || tipo === 'inbound';
    });
    const statusContainsReply = statusResposta.includes('respond') || statusResposta.includes('replied') || statusResposta === 'respondeu';
    // Lead status like WHATSAPP or QUALIFICADO can indicate engagement
    const leadStatus = String(d.status || '').toUpperCase();
    const isEngaged = leadStatus === 'WHATSAPP' || leadStatus === 'QUALIFICADO';

    if (statusContainsReply || hasDataResposta || hasRepliedFlag || hasReceivedMessage || isEngaged) {
      statusResposta = 'respondeu';
    } else if (codigoStatus === 'NAO_RESPONDEU') {
      statusResposta = 'ignorou';
    } else if (!statusResposta || statusResposta === 'undefined') {
      statusResposta = 'aguardando';
    }

    // Build historico: if empty, synthesize from available data
    let parsedHistorico: MakeInteraction[] = [];
    if (Array.isArray(d.historico || d.history)) {
      parsedHistorico = (d.historico || d.history).map((h: any) => ({
        tipo: h.tipo || h.type || 'enviada',
        mensagem: h.mensagem || h.message || '',
        data: h.data || h.date || '',
      }));
    }
    
    // If no historico but we have data, synthesize entries
    if (parsedHistorico.length === 0) {
      const cadastroDate = d['Data e Hora | Cadastro do Lead'] || d.data_envio || d.sent_at || '';
      if (cadastroDate) {
        parsedHistorico.push({ tipo: 'enviada', mensagem: 'Mensagem inicial enviada', data: cadastroDate });
      }
      if (d.ultima_msg_sol) {
        parsedHistorico.push({ tipo: 'enviada', mensagem: 'Follow-up SOL', data: d.ultima_msg_sol });
      }
      if (fupCount > 0) {
        for (let i = 0; i < Math.min(fupCount, 3); i++) {
          parsedHistorico.push({ tipo: 'enviada', mensagem: `FUP Frio #${i + 1}`, data: d.last_followup_date || '' });
        }
      }
      if (hasDataResposta) {
        parsedHistorico.push({ tipo: 'recebida', mensagem: 'Resposta do lead', data: d.data_resposta || d.response_date || '' });
      }
    }

    return {
      telefone: phone,
      robo,
      ultima_mensagem: String(d.ultima_mensagem || d.last_message || d.mensagem || ''),
      data_envio: String(d['Data e Hora | Cadastro do Lead'] || d.ultima_mensagem || d.data_envio || d.sent_at || ''),
      status_resposta: statusResposta as any,
      data_resposta: d.data_resposta || d.response_date || undefined,
      historico: parsedHistorico,
      makeStatus: String(d.status || '').toUpperCase() || undefined,
      makeTemperatura: String(d.Temperatura || d.temperatura || '').toUpperCase() || undefined,
      makeScore: String(d.Score || d.score || '') || undefined,
      nome: String(d.nome || d.name || ''),
      cidade: String(d.Cidade || d.cidade || d.city || ''),
      valorConta: String(d.valor_conta || ''),
      imovel: String(d.imovel || ''),
      email: String(d.email || ''),
      projectId: String(d.projectId || ''),
      followupCount: fupCount,
      lastFollowupDate: String(d.last_followup_date || ''),
      codigoStatus: codigoStatus,
    };
  });
}

async function fetchMakeData(): Promise<MakeRecord[]> {
  const { data, error } = await supabase.functions.invoke<MakeResponse>('fetch-make-data');

  if (error) {
    console.error('Error fetching Make data:', error);
    throw new Error(error.message || 'Failed to fetch Make data');
  }

  if (!data || data.error) {
    throw new Error(data?.error || 'No data returned');
  }

  return parseRecords(data.data);
}

export function useMakeDataStore() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['make-data-store'],
    queryFn: fetchMakeData,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
    retry: 1,
    enabled: !!user,
  });
}

/** Build a map keyed by normalized phone for O(1) lookup */
export function buildMakeMap(records: MakeRecord[]): Map<string, MakeRecord[]> {
  const map = new Map<string, MakeRecord[]>();
  for (const r of records) {
    if (!r.telefone) continue;
    const existing = map.get(r.telefone) || [];
    existing.push(r);
    map.set(r.telefone, existing);
  }
  return map;
}
