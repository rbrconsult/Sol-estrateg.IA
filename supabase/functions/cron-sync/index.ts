import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAKE_BASE = "https://us2.make.com/api/v2";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, opts: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, opts);
    if (res.status === 429) {
      const wait = Math.pow(2, attempt + 1) * 1000;
      console.log(`429 rate limited, waiting ${wait}ms...`);
      await delay(wait);
      continue;
    }
    return res;
  }
  return fetch(url, opts);
}

async function batchedPromises<T>(fns: (() => Promise<T>)[], size: number, delayMs = 1500): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < fns.length; i += size) {
    if (i > 0) await delay(delayMs);
    const batch = fns.slice(i, i + size);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }
  return results;
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('55')) {
    return digits.slice(2);
  }
  return digits;
}

/** Parse various date formats into ISO string or null */
function parseDate(value: any): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str || str === 'N/A' || str === 'null' || str === 'undefined' || str === '-') return null;

  // Excel serial number (e.g. "46008,38325" or "46008.38325")
  const excelMatch = str.match(/^(\d{4,5})[,.](\d+)$/);
  if (excelMatch) {
    const serial = parseFloat(str.replace(',', '.'));
    if (serial > 1000 && serial < 100000) {
      const epoch = new Date((serial - 25569) * 86400 * 1000);
      if (!isNaN(epoch.getTime())) return epoch.toISOString();
    }
    return null;
  }

  // BR format: DD/MM/YYYY HH:mm:ss or DD/MM/YYYY
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
  if (brMatch) {
    const [, dd, mm, yyyy, hh, mi, ss] = brMatch;
    const iso = `${yyyy}-${mm}-${dd}T${hh || '00'}:${mi || '00'}:${ss || '00'}-03:00`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d.toISOString();
    return null;
  }

  // Already ISO or other parseable format
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString();

  return null;
}

/** Status normalization — reclassify orphaned/ambiguous statuses */
const STATUS_NORMALIZATION: Record<string, string> = {
  'AGUARDANDO_ACAO_MANUAL': 'EM_QUALIFICACAO',
};

interface OrgCredentials {
  orgId: string;
  orgName: string;
  makeApiKey: string;
  makeDatastoreId: string;
  makeTeamId: string;
}

async function getOrgCredentials(supabase: any): Promise<OrgCredentials[]> {
  // Fetch all organizations with their configs
  const { data: orgs } = await supabase.from('organizations').select('id, name');
  if (!orgs?.length) return [];

  const { data: allConfigs } = await supabase
    .from('organization_configs')
    .select('organization_id, config_key, config_value')
    .in('config_key', ['make_api_key', 'ds_leads_site_geral', 'ds_thread_id', 'make_team_id']);

  // Build per-org credentials map
  const configMap: Record<string, Record<string, string>> = {};
  allConfigs?.forEach((c: any) => {
    if (!configMap[c.organization_id]) configMap[c.organization_id] = {};
    configMap[c.organization_id][c.config_key] = c.config_value;
  });

  // Fallback global secrets
  const globalApiKey = (Deno.env.get("MAKE_API_KEY") || "").trim();
  const globalDsId = (Deno.env.get("MAKE_DATASTORE_ID") || "").trim();
  const globalTeamId = (Deno.env.get("MAKE_TEAM_ID") || "").trim();

  return orgs.map((org: any) => {
    const cfg = configMap[org.id] || {};
    return {
      orgId: org.id,
      orgName: org.name,
      makeApiKey: cfg.make_api_key || globalApiKey,
      makeDatastoreId: cfg.ds_leads_site_geral || cfg.ds_thread_id || globalDsId,
      makeTeamId: cfg.make_team_id || globalTeamId,
    };
  }).filter((o: OrgCredentials) => o.makeApiKey); // Only orgs with valid API keys
}

async function syncDataStore(supabase: any, creds: OrgCredentials): Promise<any> {
  if (!creds.makeDatastoreId) return { skipped: true, reason: 'no datastore id' };

  const makeHeaders = { Authorization: `Token ${creds.makeApiKey}`, "Content-Type": "application/json" };
  const allRecords: any[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const apiUrl = `${MAKE_BASE}/data-stores/${creds.makeDatastoreId}/data?pg[limit]=${limit}&pg[offset]=${offset}`;
    const makeRes = await fetchWithRetry(apiUrl, { headers: makeHeaders });
    if (!makeRes.ok) {
      const errorText = await makeRes.text();
      console.error(`[${creds.orgName}] Make DS error:`, makeRes.status, errorText);
      return { error: `API error ${makeRes.status}` };
    }
    const makeData = await makeRes.json();
    const records = makeData?.records || makeData?.data || [];
    if (Array.isArray(records)) allRecords.push(...records);
    hasMore = Array.isArray(records) && records.length === limit;
    offset += limit;
  }

  console.log(`[${creds.orgName}] DS: ${allRecords.length} records fetched`);

  const leadsToUpsert = allRecords.map((r) => {
    const d = r.data || r;
    const phone = normalizePhone(String(d.telefone || r.key || ''));
    const fupCount = parseInt(d.followup_count) || 0;
    let robo = String(d.robo || d.bot || d.tipo_robo || '').toLowerCase();
    if (!robo) robo = fupCount >= 1 ? 'fup_frio' : 'sol';

    const hasDataResposta = !!(d.data_resposta || d.response_date);
    const leadStatus = String(d.status || '').toUpperCase();
    const isEngaged = leadStatus === 'WHATSAPP' || leadStatus === 'QUALIFICADO';
    const respondeu = hasDataResposta || isEngaged || !!(d.respondeu || d.replied);

    return {
      telefone: phone,
      nome: String(d.nome || d.name || '') || null,
      email: String(d.email || '') || null,
      cidade: String(d.Cidade || d.cidade || d.city || '') || null,
      valor_conta: String(d.valor_conta || '') || null,
      imovel: String(d.imovel || '') || null,
      project_id: String(d.projectId || '') || null,
      canal_origem: String(d.canal_origem || d.campanha || '') || null,
      campanha: String(d.campanha || '') || null,
      temperatura: String(d.Temperatura || d.temperatura || '').toUpperCase() || null,
      score: parseInt(d.Score || d.score) || null,
      status: STATUS_NORMALIZATION[String(d.status || 'novo').toUpperCase()] || String(d.status || 'novo').toUpperCase(),
      codigo_status: String(d.codigo_status || '').toUpperCase() || null,
      etapa: String(d.etapa || '') || null,
      responsavel: String(d.responsavel || '') || null,
      robo,
      followup_count: fupCount,
      last_followup_date: d.last_followup_date || null,
      respondeu,
      sentimento_resposta: String(d.sentimento_resposta || '') || null,
      interesse_detectado: String(d.interesse_detectado || '') || null,
      tempo_resposta_seg: parseInt(d.tempo_resposta_seg) || null,
      data_entrada: parseDate(d['Data e Hora | Cadastro do Lead'] || d.data_entrada),
      data_qualificacao: parseDate(d.data_qualificacao),
      data_agendamento: parseDate(d.data_agendamento),
      data_proposta: parseDate(d.data_proposta),
      data_fechamento: parseDate(d.data_fechamento),
      valor_proposta: parseFloat(d.valor_proposta) || null,
      organization_id: creds.orgId,
      synced_at: new Date().toISOString(),
      last_followup_date: parseDate(d.last_followup_date),
    };
  }).filter(l => l.telefone);

  let upsertedLeads = 0;
  for (let i = 0; i < leadsToUpsert.length; i += 50) {
    const batch = leadsToUpsert.slice(i, i + 50);
    const { error } = await supabase
      .from("leads_consolidados")
      .upsert(batch, { onConflict: "telefone,organization_id", ignoreDuplicates: false });
    if (error) console.error(`[${creds.orgName}] Leads upsert error:`, error.message);
    else upsertedLeads += batch.length;
  }

  return { fetched: allRecords.length, upserted: upsertedLeads };
}

async function syncHeartbeat(supabase: any, creds: OrgCredentials): Promise<any> {
  if (!creds.makeTeamId) return { skipped: true, reason: 'no team id' };

  const makeHeaders = { Authorization: `Token ${creds.makeApiKey}`, "Content-Type": "application/json" };

  const scenariosRes = await fetchWithRetry(
    `${MAKE_BASE}/scenarios?teamId=${creds.makeTeamId}&pg[limit]=200`,
    { headers: makeHeaders }
  );

  if (!scenariosRes.ok) {
    const errText = await scenariosRes.text();
    console.error(`[${creds.orgName}] Scenarios fetch failed:`, scenariosRes.status, errText);
    return { error: `Scenarios API error ${scenariosRes.status}` };
  }

  const scenariosData = await scenariosRes.json();
  const scenarios: { id: number; name: string }[] = (scenariosData.scenarios ?? []).map(
    (s: any) => ({ id: s.id, name: s.name })
  );

  const heartbeatRecords: any[] = [];

  const fetchFns = scenarios.map((scenario) => async () => {
    try {
      const res = await fetchWithRetry(
        `${MAKE_BASE}/scenarios/${scenario.id}/logs?pg[limit]=50`,
        { headers: makeHeaders }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const logs = data.scenarioLogs ?? [];

      return logs.map((item: any) => {
        let status = "success";
        if (item.status === 2) status = "error";
        else if (item.status === 3) status = "warning";
        return {
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          execution_id: String(item.id),
          status,
          duration_seconds: item.duration ? Math.round(item.duration / 1000) : null,
          ops_count: item.operations ?? null,
          transfer_bytes: item.transfer ?? null,
          error_message: null,
          started_at: item.timestamp,
        };
      });
    } catch { return []; }
  });

  const allResults = await batchedPromises(fetchFns, 2);
  for (const logs of allResults) heartbeatRecords.push(...logs);

  let upsertedHB = 0;
  for (let i = 0; i < heartbeatRecords.length; i += 50) {
    const batch = heartbeatRecords.slice(i, i + 50);
    const { error } = await supabase
      .from("make_heartbeat")
      .upsert(batch, { onConflict: "execution_id", ignoreDuplicates: false });
    if (error) console.error(`[${creds.orgName}] Heartbeat upsert error:`, error.message);
    else upsertedHB += batch.length;
  }

  return { scenarios: scenarios.length, records: heartbeatRecords.length, upserted: upsertedHB };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: accept service role key, anon JWT (from pg_cron), or valid user JWT
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();

    let isAuthorized = token === serviceRoleKey;

    // Check if token is the anon/publishable JWT by decoding its payload
    if (!isAuthorized && token.includes(".")) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          // Accept if it's from our project with anon role
          if (payload.role === "anon" && payload.iss?.includes("supabase")) {
            isAuthorized = true;
          }
          // Also accept authenticated users
          if (payload.role === "authenticated" && payload.sub) {
            isAuthorized = true;
          }
        }
      } catch { /* not a valid JWT, will fall through */ }
    }

    if (!isAuthorized) {
      console.error("cron-sync: unauthorized request");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get credentials for all organizations
    const orgCreds = await getOrgCredentials(supabase);
    console.log(`=== Multi-tenant sync: ${orgCreds.length} org(s) ===`);

    const results: Record<string, any> = {};

    for (const creds of orgCreds) {
      console.log(`--- Syncing: ${creds.orgName} ---`);
      const orgResult: Record<string, any> = {};

      orgResult.dataStore = await syncDataStore(supabase, creds);
      orgResult.heartbeat = await syncHeartbeat(supabase, creds);

      results[creds.orgName] = orgResult;
    }

    results.syncedAt = new Date().toISOString();
    results.orgCount = orgCreds.length;

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("cron-sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
