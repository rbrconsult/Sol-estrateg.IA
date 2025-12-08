import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { importPKCS8, SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts";

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

// Normalize private key to proper PEM format
function normalizePrivateKey(key: string): string {
  // Remove any surrounding quotes
  let normalizedKey = key.replace(/^["']|["']$/g, '');
  
  // Replace escaped newlines with actual newlines
  normalizedKey = normalizedKey.replace(/\\n/g, '\n');
  
  // Extract the base64 content (remove headers/footers and whitespace)
  const beginMarker = '-----BEGIN PRIVATE KEY-----';
  const endMarker = '-----END PRIVATE KEY-----';
  
  let content = normalizedKey
    .replace(beginMarker, '')
    .replace(endMarker, '')
    .replace(/[\s\n\r]/g, ''); // Remove all whitespace
  
  // Reformat to proper PEM with 64-char lines
  const lines: string[] = [];
  for (let i = 0; i < content.length; i += 64) {
    lines.push(content.substring(i, i + 64));
  }
  
  const formattedKey = `${beginMarker}\n${lines.join('\n')}\n${endMarker}`;
  
  console.log('Formatted key preview:', formattedKey.substring(0, 100) + '...');
  
  return formattedKey;
}

// Get access token from Google OAuth2 using jose library
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const normalizedKey = normalizePrivateKey(privateKey);
  
  console.log('Importing key with jose...');
  
  const key = await importPKCS8(normalizedKey, 'RS256');
  
  console.log('Key imported successfully');
  
  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(clientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  console.log('JWT created successfully');

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
  console.log('Access token obtained successfully');
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID');
    const CLIENT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY');

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

    if (!CLIENT_EMAIL) {
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL');
      return new Response(
        JSON.stringify({ 
          error: 'Missing configuration',
          message: 'Google Service Account Email not configured'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!PRIVATE_KEY) {
      console.error('Missing GOOGLE_PRIVATE_KEY');
      return new Response(
        JSON.stringify({ 
          error: 'Missing configuration',
          message: 'Google Private Key not configured'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Using client email:', CLIENT_EMAIL);

    // Get OAuth2 access token
    const accessToken = await getAccessToken(CLIENT_EMAIL, PRIVATE_KEY);

    // Fetch data from Google Sheets API with OAuth2
    const sheetName = 'Página1';
    const range = `${sheetName}!A:P`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;

    console.log('Fetching from Google Sheets...');
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
