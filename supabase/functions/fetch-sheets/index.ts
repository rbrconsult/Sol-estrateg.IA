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
  origem_lead: string;
  data_primeiro_contato: string;
  data_ultimo_contato: string;
  numero_followups: string;
  proxima_atividade: string;
  probabilidade: string;
  motivo_perda: string;
  tempo_na_etapa: string;
  desconto: string;
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
      origem_lead: row[16] || '',
      data_primeiro_contato: row[17] || '',
      data_ultimo_contato: row[18] || '',
      numero_followups: row[19] || '0',
      proxima_atividade: row[20] || '',
      probabilidade: row[21] || '50',
      motivo_perda: row[22] || '',
      tempo_na_etapa: row[23] || '0',
      desconto: row[24] || '0',
    };
  }).filter((p: SheetRow) => p.projeto_id);
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;

    // Parse body
    let organizationId: string | null = null;
    try {
      const body = await req.json();
      organizationId = body.organization_id || null;
    } catch { /* no body is fine */ }

    // Security: non-super_admin can only fetch their own org
    const { data: userOrg } = await supabaseAdmin.rpc('get_user_org', { p_user_id: userId });
    const { data: isSuperAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: userId, _role: 'super_admin' });

    if (!isSuperAdmin) {
      organizationId = userOrg || null;
    }

    // Resolve sheet ID
    const SHEET_ID = await resolveSheetId(supabaseAdmin, organizationId);
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
    const proposals = parseRows(data.values || []);

    console.log(`Fetched ${proposals.length} proposals for org ${organizationId || 'fallback'}`);

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
