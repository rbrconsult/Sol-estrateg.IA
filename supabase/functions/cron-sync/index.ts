import { createClient } from "npm:@supabase/supabase-js@2";

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

const MATRIZ_ORG_ID = '00000000-0000-0000-0000-000000000001';

interface OrgCredentials {
  orgId: string;
  orgName: string;
  makeApiKey: string;
  makeDatastoreId: string;
  makeComercialDsId: string;
  makeTeamId: string;
}

async function getOrgCredentials(supabase: any): Promise<OrgCredentials[]> {
  const { data: orgs } = await supabase.from('organizations').select('id, name');
  if (!orgs?.length) return [];

  const tenantOrgs = orgs.filter((o: any) => o.id !== MATRIZ_ORG_ID);

  const { data: allConfigs } = await supabase
    .from('organization_configs')
    .select('organization_id, config_key, config_value')
    .in('config_key', ['make_api_key', 'ds_leads_site_geral', 'ds_thread_id', 'ds_comercial', 'make_team_id']);

  const configMap: Record<string, Record<string, string>> = {};
  allConfigs?.forEach((c: any) => {
    if (!configMap[c.organization_id]) configMap[c.organization_id] = {};
    configMap[c.organization_id][c.config_key] = c.config_value;
  });

  const globalApiKey = (Deno.env.get("MAKE_API_KEY") || "").trim();
  const globalDsId = (Deno.env.get("MAKE_DATASTORE_ID") || "").trim();
  const globalComercialDsId = (Deno.env.get("MAKE_COMERCIAL_DATASTORE_ID") || "").trim();
  const globalTeamId = (Deno.env.get("MAKE_TEAM_ID") || "").trim();

  return tenantOrgs.map((org: any) => {
    const cfg = configMap[org.id] || {};
    return {
      orgId: org.id,
      orgName: org.name,
      makeApiKey: cfg.make_api_key || globalApiKey,
      // Prioritize thread DS (64798) as source of truth for SOL/FUP journey and statuses
      makeDatastoreId: cfg.ds_thread_id || cfg.ds_leads_site_geral || globalDsId,
      makeComercialDsId: cfg.ds_comercial || globalComercialDsId,
      makeTeamId: cfg.make_team_id || globalTeamId,
    };
  }).filter((o: OrgCredentials) => o.makeApiKey);
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

    // Parse data_entrada — try multiple source fields
    const parsedDataEntrada = parseDate(d.data_hora_cadastro) 
      || parseDate(d['Data e Hora | Cadastro do Lead']) 
      || parseDate(d.data_entrada);

    const record: Record<string, any> = {
      telefone: phone,
      nome: String(d.nome || d.name || '') || null,
      email: String(d.email || '') || null,
      cidade: String(d.Cidade || d.cidade || d.city || '') || null,
      valor_conta: String(d.valor_conta || '') || null,
      imovel: String(d.imovel || '') || null,
      project_id: String(d.projectId || '') || null,
      canal_origem: String(d.canal_origem || d.campanha || '') || null,
      campanha: String(d.campanha || '') || null,
      closer_atribuido: String(d.closer_atribuido || '') || null,
      temperatura: String(d.Temperatura || d.temperatura || '').toUpperCase() || null,
      score: parseInt(d.Score || d.score) || null,
      status: STATUS_NORMALIZATION[String(d.status || 'novo').toUpperCase()] || String(d.status || 'novo').toUpperCase(),
      codigo_status: String(d.codigo_status || '').toUpperCase() || null,
      etapa: String(d.etapa_funil || d.etapa || '') || null,
      responsavel: String(d.responsavel || '') || null,
      robo,
      followup_count: fupCount,
      last_followup_date: parseDate(d.last_followup_date),
      respondeu,
      sentimento_resposta: String(d.sentimento_resposta || '') || null,
      interesse_detectado: String(d.interesse_detectado || '') || null,
      tempo_resposta_seg: parseInt(d.tempo_resposta_seg) || null,
      data_qualificacao: parseDate(d.data_qualificacao),
      data_agendamento: parseDate(d.data_agendamento),
      data_proposta: parseDate(d.data_proposta),
      data_fechamento: parseDate(d.data_fechamento),
      valor_proposta: parseFloat(d.valor_proposta) || null,
      organization_id: creds.orgId,
      synced_at: new Date().toISOString(),
    };

    // CRITICAL: Only set data_entrada if we have a real parsed value
    // This prevents overwriting existing DB values with null on each sync
    if (parsedDataEntrada) {
      record.data_entrada = parsedDataEntrada;
    }

    return record;
  }).filter((l: any) => l.telefone);

  // Split into two groups: with and without data_entrada to avoid overwriting nulls
  const withDataEntrada = leadsToUpsert.filter((l: any) => l.data_entrada);
  const withoutDataEntrada = leadsToUpsert.filter((l: any) => !l.data_entrada);

  let upsertedLeads = 0;

  // Batch upsert records WITH data_entrada (full upsert)
  for (let i = 0; i < withDataEntrada.length; i += 50) {
    const batch = withDataEntrada.slice(i, i + 50);
    const { error } = await supabase
      .from("leads_consolidados")
      .upsert(batch, { onConflict: "telefone,organization_id", ignoreDuplicates: false });
    if (error) console.error(`[${creds.orgName}] Leads upsert error:`, error.message);
    else upsertedLeads += batch.length;
  }

  // Batch upsert records WITHOUT data_entrada (exclude data_entrada column to preserve DB value)
  for (let i = 0; i < withoutDataEntrada.length; i += 50) {
    const batch = withoutDataEntrada.slice(i, i + 50);
    const { error } = await supabase
      .from("leads_consolidados")
      .upsert(batch, { onConflict: "telefone,organization_id", ignoreDuplicates: false });
    if (error) console.error(`[${creds.orgName}] Leads upsert (no date) error:`, error.message);
    else upsertedLeads += batch.length;
  }

  console.log(`[${creds.orgName}] Upserted: ${withDataEntrada.length} with date, ${withoutDataEntrada.length} without date`);

  return { fetched: allRecords.length, upserted: upsertedLeads };
}

/** Sync DS Comercial (84404) — enrich leads_consolidados with CRM data */
async function syncComercialDS(supabase: any, creds: OrgCredentials): Promise<any> {
  if (!creds.makeComercialDsId) return { skipped: true, reason: 'no comercial DS id' };

  const makeHeaders = { Authorization: `Token ${creds.makeApiKey}`, "Content-Type": "application/json" };
  const allRecords: any[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const apiUrl = `${MAKE_BASE}/data-stores/${creds.makeComercialDsId}/data?pg[limit]=${limit}&pg[offset]=${offset}`;
    const makeRes = await fetchWithRetry(apiUrl, { headers: makeHeaders });
    if (!makeRes.ok) {
      const errorText = await makeRes.text();
      console.error(`[${creds.orgName}] Comercial DS error:`, makeRes.status, errorText);
      return { error: `API error ${makeRes.status}` };
    }
    const makeData = await makeRes.json();
    const records = makeData?.records || makeData?.data || [];
    if (Array.isArray(records)) allRecords.push(...records);
    hasMore = Array.isArray(records) && records.length === limit;
    offset += limit;
  }

  console.log(`[${creds.orgName}] Comercial DS: ${allRecords.length} records`);

  // Build phone→comercial map for enrichment
  let enriched = 0;
  for (const r of allRecords) {
    const d = r.data || r;
    const phone = normalizePhone(String(d.telefone || d.phone || r.key || ''));
    if (!phone) continue;

    const etapaSm = String(d.etapa_sm || d.etapa || '').trim();
    const statusProposta = String(d.status_proposta || '').trim();
    const representante = String(d.representante || d.closer || '').trim();
    const valorProposta = parseFloat(d.valor_proposta) || null;
    const potencia = parseFloat(d.potencia_sistema || d.potencia) || null;
    const dataProposta = parseDate(d.data_proposta || d.data_criacao_proposta);
    const dataFechamento = parseDate(d.data_fechamento || d.data_contrato);

    // Determine closer_atribuido from representante
    const closerAtribuido = representante || null;

    const updateFields: Record<string, any> = {};
    if (etapaSm) updateFields.etapa_sm = etapaSm;
    if (statusProposta) updateFields.status_proposta = statusProposta;
    if (closerAtribuido) updateFields.closer_atribuido = closerAtribuido;
    if (representante) updateFields.representante = representante;
    if (valorProposta) updateFields.valor_proposta = valorProposta;
    if (potencia) updateFields.potencia_sistema = potencia;
    if (dataProposta) updateFields.data_proposta = dataProposta;
    if (dataFechamento) updateFields.data_fechamento = dataFechamento;

    if (Object.keys(updateFields).length === 0) continue;

    const { error } = await supabase
      .from('leads_consolidados')
      .update(updateFields)
      .eq('telefone', phone)
      .eq('organization_id', creds.orgId);

    if (!error) enriched++;
  }

  return { fetched: allRecords.length, enriched };
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

  // Auto-update monitored_scenario_ids in app_settings
  const monitoredPayload = scenarios.map((s) => ({ id: s.id, name: s.name }));
  await supabase
    .from("app_settings")
    .upsert(
      { key: "monitored_scenario_ids", value: JSON.stringify(monitoredPayload), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  console.log(`[${creds.orgName}] Auto-updated ${monitoredPayload.length} monitored scenarios`);

  // Auto-discover Data Stores
  try {
    const dsRes = await fetchWithRetry(
      `${MAKE_BASE}/data-stores?teamId=${creds.makeTeamId}&pg[limit]=200`,
      { headers: makeHeaders }
    );
    if (dsRes.ok) {
      const dsData = await dsRes.json();
      const dataStores = (dsData.dataStores ?? []).map((ds: any) => ({
        id: ds.id,
        name: ds.name,
        records: ds.records ?? 0,
        size: ds.datasize ?? 0,
      }));
      await supabase
        .from("app_settings")
        .upsert(
          { key: "make_data_stores", value: JSON.stringify(dataStores), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      console.log(`[${creds.orgName}] Auto-discovered ${dataStores.length} data stores`);
    }
  } catch (dsErr) {
    console.error(`[${creds.orgName}] DS discovery error:`, dsErr);
  }

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

  const dedupMap = new Map<string, any>();
  for (const r of heartbeatRecords) {
    dedupMap.set(r.execution_id, r);
  }
  const dedupRecords = Array.from(dedupMap.values());

  let upsertedHB = 0;
  for (let i = 0; i < dedupRecords.length; i += 50) {
    const batch = dedupRecords.slice(i, i + 50);
    const { error } = await supabase
      .from("make_heartbeat")
      .upsert(batch, { onConflict: "execution_id", ignoreDuplicates: false });
    if (error) console.error(`[${creds.orgName}] Heartbeat upsert error:`, error.message);
    else upsertedHB += batch.length;
  }

  return { scenarios: scenarios.length, records: dedupRecords.length, upserted: upsertedHB };
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
      orgResult.comercial = await syncComercialDS(supabase, creds);
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
