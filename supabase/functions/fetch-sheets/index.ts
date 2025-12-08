import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
}

// Create JWT for Google OAuth2
async function createJWT(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signatureB64}`;
}

// Get access token from Google OAuth2
async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const jwt = await createJWT(serviceAccount);
  
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
    console.error('OAuth2 token error:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID');
    const SERVICE_ACCOUNT_KEY = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

    if (!SHEET_ID) {
      console.error('Missing GOOGLE_SHEET_ID');
      return new Response(
        JSON.stringify({ 
          error: 'Missing configuration',
          message: 'Google Sheet ID not configured'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!SERVICE_ACCOUNT_KEY) {
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_KEY');
      return new Response(
        JSON.stringify({ 
          error: 'Missing configuration',
          message: 'Google Service Account Key not configured'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse service account credentials
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.error('Failed to parse service account key:', e);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid configuration',
          message: 'Failed to parse service account credentials'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get OAuth2 access token
    console.log('Getting OAuth2 access token...');
    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtained successfully');

    // Fetch data from Google Sheets API with OAuth2
    const sheetName = 'Sheet1';
    const range = `${sheetName}!A:P`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;

    console.log('Fetching from Google Sheets with OAuth2...');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch from Google Sheets',
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ data: [], message: 'No data found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip header row and map data
    const dataRows = rows.slice(1);

    const proposals: SheetRow[] = dataRows.map((row: string[]) => {
      // Parse valor da proposta
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
      };
    }).filter((p: SheetRow) => p.projeto_id);

    console.log(`Fetched ${proposals.length} proposals from Google Sheets`);

    return new Response(
      JSON.stringify({ 
        data: proposals,
        count: proposals.length,
        lastUpdate: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
