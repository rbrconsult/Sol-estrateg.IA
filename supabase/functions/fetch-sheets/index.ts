import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { importPKCS8, SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SheetRow {
  etapa: string;
  projeto_id: string;
  nome_cliente: string;
  cliente_telefone: string;
  cliente_email: string;
  status: string;
  responsavel: string;
  representante: string;
  valor_proposta: number;
  potencia_sistema: string;
  nome_proposta: string;
  data_criacao_projeto: string;
  data_criacao_proposta: string;
  sla_proposta: string;
  ultima_atualizacao: string;
  dados_projeto: string;
  sol_qualificado: string;
  sol_score: string;
  temperatura: string;
  data_qualificacao_sol: string;
  nota_completa: string;
  tempo_na_etapa: string;
  sol_sdr: string;
  tempo_sol_sdr: string;
  etiquetas: string;
}

function normalizePrivateKey(key: string): string {
  let normalizedKey = key.replace(/^["']|["']$/g, '');
  normalizedKey = normalizedKey.replace(/\\n/g, '\n');
  const beginMarker = '-----BEGIN PRIVATE KEY-----';
  const endMarker = '-----END PRIVATE KEY-----';
  let content = normalizedKey.replace(beginMarker, '').replace(endMarker, '').replace(/[\s\n\r]/g, '');
  const lines: string[] = [];
  for (let i = 0; i < content.length; i += 64) {
    lines.push(content.substring(i, i + 64));
  }
  return `${beginMarker}\n${lines.join('\n')}\n${endMarker}`;
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const normalizedKey = normalizePrivateKey(privateKey);
  const key = await importPKCS8(normalizedKey, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets.readonly' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(clientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function resolveSheetId(supabaseAdmin: any, organizationId: string | null): Promise<string> {
  const fallback = Deno.env.get('GOOGLE_SHEET_ID');

  if (!organizationId) {
    if (!fallback) throw new Error('No organization_id provided and no fallback GOOGLE_SHEET_ID configured');
    return fallback;
  }

  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  if (error || !org) {
    console.warn('Could not find org, using fallback:', error?.message);
    if (!fallback) throw new Error('Organization not found and no fallback GOOGLE_SHEET_ID configured');
    return fallback;
  }

  const sheetId = (org.settings as any)?.google_sheet_id;
  if (sheetId) return sheetId;

  if (!fallback) throw new Error('Organization has no google_sheet_id and no fallback configured');
  return fallback;
}

function parseRows(rows: string[][]): SheetRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((row: string[]) => {
    const valorStr = row[8] || '0';
    const valorNumerico = parseFloat(valorStr.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    return {
      etapa: row[0] || '',
      projeto_id: row[1] || '',
      nome_cliente: row[2] || '',
      cliente_telefone: row[3] || '',
      cliente_email: row[4] || '',
      status: row[5] || '',
      responsavel: row[6] || '',
      representante: row[7] || '',
      valor_proposta: valorNumerico,
      potencia_sistema: row[9] || '',
      nome_proposta: row[10] || '',
      data_criacao_projeto: row[11] || '',
      data_criacao_proposta: row[12] || '',
      sla_proposta: row[13] || '',
      ultima_atualizacao: row[14] || '',
      dados_projeto: row[15] || '',
      sol_qualificado: row[16] || '',
      sol_score: row[17] || '',
      temperatura: row[18] || '',
      data_qualificacao_sol: row[19] || '',
      nota_completa: row[20] || '',
      tempo_na_etapa: row[21] || '0',
      sol_sdr: row[22] || '',
      tempo_sol_sdr: row[23] || '0',
      etiquetas: row[24] || '',
    };
  }).filter((p: SheetRow) => p.projeto_id || p.nome_cliente);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = authUser.id;

    // Parse body
    let requestedOrgId: string | null = null;
    try {
      const body = await req.json();
      requestedOrgId = body.organization_id || null;
    } catch { /* no body is fine */ }

    // Security: check roles and determine target org
    const { data: userOrg } = await supabaseAdmin.rpc('get_user_org', { p_user_id: userId });
    const { data: isSuperAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: userId, _role: 'super_admin' });

    let targetOrgId: string | null = null;

    if (isSuperAdmin && requestedOrgId) {
      // Super admin selected a specific filial
      targetOrgId = requestedOrgId;
    } else if (isSuperAdmin && !requestedOrgId) {
      // Super admin in Global mode — no org filter, use fallback sheet
      targetOrgId = null;
    } else {
      // Regular user — use their own org
      targetOrgId = userOrg || null;
    }

    // Get allowed responsáveis if filtering by org
    let allowedResponsaveis: string[] = [];
    if (targetOrgId) {
      const { data: configs } = await supabaseAdmin
        .from('organization_configs')
        .select('config_value')
        .eq('organization_id', targetOrgId)
        .eq('config_category', 'responsavel');

      allowedResponsaveis = (configs || [])
        .map((c: any) => String(c.config_value).trim().toLowerCase())
        .filter(Boolean);

      // Non-admin with no responsáveis configured = empty result
      if (allowedResponsaveis.length === 0 && !isSuperAdmin) {
        console.log(`fetch-sheets: no responsaveis for org ${targetOrgId}, returning empty`);
        return new Response(
          JSON.stringify({ data: [], count: 0, lastUpdate: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Resolve sheet ID (use targetOrgId for org-specific sheets)
    const SHEET_ID = await resolveSheetId(supabaseAdmin, targetOrgId);
    const CLIENT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!CLIENT_EMAIL || !PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Google configuration' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const accessToken = await getAccessToken(CLIENT_EMAIL, PRIVATE_KEY);

    const sheetName = 'Página1';
    const range = `${sheetName}!A:Y`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;

    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch from Google Sheets', details: errorText }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    let proposals = parseRows(data.values || []);

    // Server-side filter by responsáveis when an org is selected
    if (allowedResponsaveis.length > 0) {
      const before = proposals.length;
      proposals = proposals.filter((p) => {
        const resp = (p.responsavel || '').trim().toLowerCase();
        const rep = (p.representante || '').trim().toLowerCase();
        return allowedResponsaveis.some(
          (name) => resp === name || rep === name
        );
      });
      console.log(`fetch-sheets: ${before} total → ${proposals.length} filtered (org: ${targetOrgId}, ${allowedResponsaveis.length} allowed responsáveis)`);
    } else {
      console.log(`fetch-sheets: ${proposals.length} proposals (no filter, global/super_admin)`);
    }

    return new Response(
      JSON.stringify({ data: proposals, count: proposals.length, lastUpdate: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
