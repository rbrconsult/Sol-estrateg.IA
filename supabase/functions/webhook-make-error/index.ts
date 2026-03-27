import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KROLIC_SEND_URL = "https://api.camkrolik.com.br/core/v2/api/chats/send-text";

const CRITICAL_FLOW_PATTERNS = [
  /captura.*lead/i, /fluxo 1/i, /fluxo 2/i, /sdr/i, /qualif/i,
  /sync.*ds/i, /sol.*sync/i, /data.*store/i, /funil/i,
];

function isCriticalFlow(name: string): boolean {
  return CRITICAL_FLOW_PATTERNS.some((p) => p.test(name ?? ""));
}

function detectCategory(name: string): string {
  const n = (name ?? "").toLowerCase();
  if (/sol|sdr|qualif/i.test(n)) return "SDR / Qualificação";
  if (/pagamento|asaas|pix/i.test(n)) return "Financeiro";
  if (/whatsapp|mensagem/i.test(n)) return "Mensageria";
  if (/solarmarket|crm|krolic/i.test(n)) return "Integração CRM";
  return "Geral Evolve";
}

async function sendWhatsAppMessage(apiKey: string, phone: string, message: string): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const response = await fetch(KROLIC_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access-token": apiKey },
      body: JSON.stringify({ number: phoneWithCountry, message, forceSend: true, verifyContact: false, linkPreview: false }),
    });
    const ok = response.status >= 200 && response.status < 300;
    try { await response.text(); } catch { /* ignore */ }
    return ok;
  } catch (e) {
    console.error("[webhook-alert] send error:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Expected payload from Make.com:
    // { scenario_id, scenario_name, execution_id, error_message, error_type, module_name, module_app, occurred_at }
    const {
      scenario_id,
      scenario_name,
      execution_id,
      error_message,
      error_type,
      module_name,
      module_app,
      failed_module_index,
      total_modules,
      attempts,
      occurred_at,
    } = body;

    if (!scenario_name && !scenario_id) {
      return new Response(JSON.stringify({ error: "Missing scenario_name or scenario_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const name = scenario_name ?? `Scenario ${scenario_id}`;
    const category = detectCategory(name);
    const isCritical = isCriticalFlow(name);
    const time = occurred_at
      ? new Date(occurred_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // 1. Upsert into make_errors
    const record = {
      execution_id: String(execution_id ?? `wh-${Date.now()}`),
      scenario_id: scenario_id ? Number(scenario_id) : null,
      scenario_name: name,
      module_name: module_name ?? "Unknown",
      module_app: module_app ?? "Unknown",
      failed_module_index: failed_module_index ?? null,
      total_modules: total_modules ?? null,
      error_type: error_type ?? "RuntimeError",
      error_code: null,
      error_message: error_message ?? "Fluxo parado",
      attempts: attempts ?? 1,
      execution_status: "stopped",
      flow_category: category,
      execution_duration_seconds: null,
      occurred_at: occurred_at ?? new Date().toISOString(),
      status: "pending",
    };

    const { data: existing } = await supabase
      .from("make_errors")
      .select("id")
      .eq("execution_id", record.execution_id)
      .maybeSingle();

    if (existing) {
      await supabase.from("make_errors").update(record).eq("execution_id", record.execution_id);
    } else {
      await supabase.from("make_errors").insert(record);
    }

    // 2. Get WhatsApp config
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["evolution_api_key", "central_whatsapp_number"]);

    const apiKey = settings?.find((s: any) => s.key === "evolution_api_key")?.value;
    const centralNumber = settings?.find((s: any) => s.key === "central_whatsapp_number")?.value;

    let alertSent = false;

    if (apiKey && centralNumber) {
      // Build N2/N3 message
      const emoji = isCritical ? "🚨🚨🚨" : "🔴";
      const level = isCritical ? "N3 — FLUXO CRÍTICO PARADO" : "N2 — FLUXO PARADO";

      const msg = [
        `${emoji} *ALERTA ${level}*`,
        "",
        `📋 *Fluxo:* ${name}`,
        `📂 *Categoria:* ${category}`,
        scenario_id ? `🆔 *Scenario ID:* ${scenario_id}` : null,
        module_name ? `⚙️ *Módulo:* [${module_app ?? "?"}] ${module_name}` : null,
        failed_module_index && total_modules
          ? `📊 *Progresso:* Parou no módulo ${failed_module_index}/${total_modules}`
          : null,
        `❌ *Tipo:* ${error_type ?? "RuntimeError"}`,
        `💬 *Erro:* ${(error_message ?? "Sem detalhes").substring(0, 300)}`,
        attempts ? `🔄 *Tentativas:* ${attempts}` : null,
        `🕐 *Horário:* ${time}`,
        execution_id ? `🆔 *Execution:* ${execution_id}` : null,
        "",
        isCritical
          ? "⚠️ *Este fluxo é CRÍTICO e afeta captura de leads/qualificação. Ação IMEDIATA necessária.*"
          : "⚠️ Este fluxo está PARADO e precisa de ação.",
        "",
        "Sol Estrateg.IA — Monitor de Fluxos ⚡",
      ].filter(Boolean).join("\n");

      alertSent = await sendWhatsAppMessage(apiKey, centralNumber, msg);
      console.log(`[webhook] Alert sent: ${alertSent} | Critical: ${isCritical} | Flow: ${name}`);
    } else {
      console.warn("[webhook] Missing apiKey or centralNumber, alert skipped");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        recorded: true,
        alertSent,
        isCritical,
        scenario: name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[webhook-make-error]", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
