import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um especialista em engenharia de prompts para agentes de IA conversacionais (SDR, follow-up, qualificação).

Contexto: O sistema SOL v2 é uma plataforma de automação de pré-venda para franquias de energia solar. Os prompts que você ajuda a configurar controlam:
- Agent SDR: robô que qualifica leads via WhatsApp
- FUP Frio: follow-up automático para leads frios
- Pré-qualificação: regras de scoring e classificação
- Newsletter: conteúdo automatizado

Ao receber um prompt atual + instrução do usuário, você deve:
1. Analisar o prompt existente e identificar pontos de melhoria
2. Aplicar as alterações solicitadas
3. Retornar o prompt revisado completo e pronto para uso
4. Incluir uma breve explicação das mudanças feitas

Regras:
- Mantenha a estrutura e variáveis existentes ({nome}, {valor_conta}, etc.)
- Preserve instruções de segurança e compliance
- Use linguagem natural e empática adequada para WhatsApp
- Seja conciso nas explicações, foque no prompt revisado`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt_key, current_content, instruction } = await req.json();

    if (!instruction || !prompt_key) {
      return new Response(
        JSON.stringify({ error: "instruction e prompt_key são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const userMessage = current_content
      ? `**Prompt atual (${prompt_key}):**\n\`\`\`\n${current_content}\n\`\`\`\n\n**Instrução do diretor:**\n${instruction}`
      : `**Criar prompt novo para:** ${prompt_key}\n\n**Instrução do diretor:**\n${instruction}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit atingido, tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no gateway IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("prompt-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
