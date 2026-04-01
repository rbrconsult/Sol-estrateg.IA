import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Skill: Golden Hour
 * Detecta leads novos que não foram contactados em 5 minutos.
 * Fluxo híbrido:
 *   1. Edge Function (esta) analisa sol_leads_sync
 *   2. Insere alerta em sol_insights
 *   3. (Opcional) dispara webhook pro Make para WhatsApp
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Check if skill is enabled for any franquia
    const { data: toggles } = await supabase
      .from("skill_toggles")
      .select("franquia_id, enabled")
      .eq("skill_id", "golden-hour")
      .eq("enabled", true);

    if (!toggles || toggles.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Skill disabled for all franquias" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const enabledFranquias = toggles.map((t) => t.franquia_id);
    const THRESHOLD_MINUTES = 5;
    const cutoff = new Date(Date.now() - THRESHOLD_MINUTES * 60 * 1000).toISOString();

    // 2. Find leads created in last 30 min that have NO interaction yet
    //    and were created more than 5 min ago (golden hour breached)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: leads, error: leadsErr } = await supabase
      .from("sol_leads_sync")
      .select("telefone, nome, franquia_id, ts_cadastro, ts_ultima_interacao, closer_nome, project_id")
      .in("franquia_id", enabledFranquias)
      .gte("ts_cadastro", thirtyMinAgo)
      .lte("ts_cadastro", cutoff)
      .is("ts_ultima_interacao", null)
      .not("status", "eq", "DESQUALIFICADO");

    if (leadsErr) {
      console.error("Error fetching leads:", leadsErr);
      return new Response(
        JSON.stringify({ error: leadsErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No Golden Hour breaches found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check which leads already have a recent golden-hour insight (avoid duplicates)
    const leadPhones = leads.map((l) => l.telefone);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: existingInsights } = await supabase
      .from("sol_insights")
      .select("dados")
      .eq("tipo", "golden_hour")
      .gte("created_at", oneHourAgo);

    const alreadyAlerted = new Set(
      (existingInsights || [])
        .map((i) => (i.dados as any)?.telefone)
        .filter(Boolean)
    );

    const newBreaches = leads.filter((l) => !alreadyAlerted.has(l.telefone));

    if (newBreaches.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "All breaches already alerted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert insights for each breach
    const insights = newBreaches.map((lead) => {
      const cadastro = new Date(lead.ts_cadastro!);
      const minutos = Math.round((Date.now() - cadastro.getTime()) / 60000);

      return {
        franquia_id: lead.franquia_id || "default",
        tipo: "golden_hour",
        categoria: "pre-venda",
        severidade: minutos > 15 ? "critico" : "alerta",
        titulo: `⏰ Golden Hour: ${lead.nome || lead.telefone}`,
        descricao: `Lead sem contato há ${minutos} minutos. Cadastrado às ${cadastro.toLocaleTimeString("pt-BR")}.`,
        acao_sugerida: `Entrar em contato imediatamente com ${lead.telefone}`,
        robo: "golden-hour",
        dados: {
          telefone: lead.telefone,
          nome: lead.nome,
          minutos_sem_contato: minutos,
          closer: lead.closer_nome,
          project_id: lead.project_id,
        },
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // expires in 2h
      };
    });

    const { error: insertErr } = await supabase
      .from("sol_insights")
      .insert(insights);

    if (insertErr) {
      console.error("Error inserting insights:", insertErr);
      return new Response(
        JSON.stringify({ error: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. (Optional) Trigger Make webhook for WhatsApp alerts
    // This is the hybrid part — Make handles the WhatsApp delivery
    const makeWebhookUrl = Deno.env.get("GOLDEN_HOUR_WEBHOOK_URL");
    if (makeWebhookUrl) {
      for (const lead of newBreaches) {
        try {
          await fetch(makeWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              skill: "golden-hour",
              telefone: lead.telefone,
              nome: lead.nome,
              closer: lead.closer_nome,
              franquia_id: lead.franquia_id,
              minutos: Math.round((Date.now() - new Date(lead.ts_cadastro!).getTime()) / 60000),
            }),
          });
        } catch (webhookErr) {
          console.error("Webhook error for", lead.telefone, webhookErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        processed: newBreaches.length,
        insights_created: newBreaches.length,
        webhook_sent: !!makeWebhookUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Golden Hour error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
