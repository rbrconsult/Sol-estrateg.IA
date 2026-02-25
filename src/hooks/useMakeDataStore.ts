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
    const hasFollowup = !!d.followup_count || !!d.ultima_mensagem;
    const robo = d.robo || d.bot || d.tipo_robo || (hasFollowup ? 'fup_frio' : 'sol');

    // Determine status from available data with heuristics
    let statusResposta = String(d.status_resposta || d.status || d.response_status || '').toLowerCase();

    // Heuristic: detect "respondeu" from multiple signals
    const hasDataResposta = !!(d.data_resposta || d.response_date) && String(d.data_resposta || d.response_date || '').trim() !== '';
    const hasRepliedFlag = !!(d.respondeu || d.replied || d.response);
    const historico = d.historico || d.history;
    const hasReceivedMessage = Array.isArray(historico) && historico.some((h: any) => {
      const tipo = String(h.tipo || h.type || '').toLowerCase();
      return tipo === 'recebida' || tipo === 'received' || tipo === 'inbound';
    });
    const statusContainsReply = statusResposta.includes('respond') || statusResposta.includes('replied') || statusResposta === 'respondeu';

    if (statusContainsReply || hasDataResposta || hasRepliedFlag || hasReceivedMessage) {
      statusResposta = 'respondeu';
    } else if (!statusResposta || statusResposta === 'undefined') {
      statusResposta = 'aguardando';
    }

    return {
      telefone: phone,
      robo: String(robo).toLowerCase(),
      ultima_mensagem: String(d.ultima_mensagem || d.last_message || d.mensagem || ''),
      data_envio: String(d.ultima_mensagem || d['Data e Hora | Cadastro do Lead'] || d.data_envio || d.sent_at || ''),
      status_resposta: statusResposta as any,
      data_resposta: d.data_resposta || d.response_date || undefined,
      historico: Array.isArray(d.historico || d.history)
        ? (d.historico || d.history).map((h: any) => ({
            tipo: h.tipo || h.type || 'enviada',
            mensagem: h.mensagem || h.message || '',
            data: h.data || h.date || '',
          }))
        : [],
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
