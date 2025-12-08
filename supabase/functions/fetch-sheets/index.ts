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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID');
    const API_KEY = Deno.env.get('GOOGLE_API_KEY');

    if (!SHEET_ID || !API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing configuration',
          message: 'Google Sheet ID or API Key not configured'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch data from Google Sheets API
    const sheetName = 'Sheet1'; // Ajuste se necessário
    const range = `${sheetName}!A:P`; // Todas as colunas até P
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;

    console.log('Fetching from Google Sheets...');
    const response = await fetch(url);

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
    const headers = rows[0];
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
        responsavel: row[6] || '', // pré-vendedor
        representante: row[7] || '', // vendedor
        valor_proposta: valorNumerico,
        potencia_sistema: row[9] || '',
        nome_proposta: row[10] || '',
        data_criacao_projeto: row[11] || '',
        data_criacao_proposta: row[12] || '',
        sla_proposta: row[13] || '',
        ultima_atualizacao: row[14] || '',
        dados_projeto: row[15] || '',
      };
    }).filter((p: SheetRow) => p.projeto_id); // Remove linhas vazias

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
