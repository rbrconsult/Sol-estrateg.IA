import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kpis, alertCount, topVendedor, healthScore, funnelBottleneck } = await req.json();

    const prompt = `Você é um consultor de vendas sênior analisando o pipeline comercial de uma empresa de energia solar. Gere um resumo executivo RAIO-X em português brasileiro, direto e acionável, com no máximo 4 parágrafos curtos.

Dados atuais do pipeline:
- Receita fechada: R$ ${kpis.valorGanho?.toLocaleString("pt-BR") || "0"}
- Receita prevista (pipeline ponderado): R$ ${kpis.receitaPrevista?.toLocaleString("pt-BR") || "0"}
- Taxa de conversão real: ${kpis.taxaConversao?.toFixed(1) || "0"}%
- Ticket médio: R$ ${kpis.ticketMedio?.toLocaleString("pt-BR") || "0"}
- Total de propostas: ${kpis.totalNegocios || 0}
- Negócios ganhos: ${kpis.negociosGanhos || 0}
- Negócios perdidos: ${kpis.negociosPerdidos || 0}
- Negócios abertos: ${kpis.negociosAbertos || 0}
- Valor do pipeline bruto: R$ ${kpis.valorPipeline?.toLocaleString("pt-BR") || "0"}
- Ciclo médio de proposta: ${kpis.cicloProposta || 0} dias
- Health Score do pipeline: ${healthScore || "N/A"}/100
- Alertas estratégicos ativos: ${alertCount || 0}
- Top vendedor: ${topVendedor || "N/A"}
- Gargalo no funil: ${funnelBottleneck || "Nenhum detectado"}

Regras:
1. Comece com um emoji de semáforo (🟢 saudável, 🟡 atenção, 🔴 risco) baseado no health score
2. Primeiro parágrafo: visão geral do estado do pipeline (1-2 frases)
3. Segundo parágrafo: principal oportunidade ou ponto positivo
4. Terceiro parágrafo: principal risco ou ação urgente
5. Quarto parágrafo: recomendação estratégica clara
6. Use linguagem executiva, concisa, sem jargão técnico
7. NÃO use markdown, apenas texto puro com quebras de linha`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Não foi possível gerar o resumo.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating executive summary:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
