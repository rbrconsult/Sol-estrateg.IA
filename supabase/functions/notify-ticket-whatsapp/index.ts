import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      ticketId,
      ticketNumero,
      titulo,
      fluxo,
      plataforma,
      clienteNome,
      clienteTelefone,
      categoria,
      prioridade,
      slaHoras,
      descricao,
      userPhone,
      userName,
    } = await req.json();

    // Create admin client to read app_settings
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch Evolution API settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "evolution_api_url",
        "evolution_api_key",
        "evolution_instance_name",
        "central_whatsapp_number",
      ]);

    if (settingsError || !settings || settings.length === 0) {
      console.error("Error fetching settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Settings not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config: Record<string, string> = {};
    for (const s of settings) {
      config[s.key] = s.value;
    }

    const apiUrl = config.evolution_api_url;
    const apiKey = config.evolution_api_key;
    const instanceName = config.evolution_instance_name;
    const centralNumber = config.central_whatsapp_number;

    if (!apiUrl || !apiKey || !instanceName) {
      return new Response(
        JSON.stringify({ error: "Evolution API not fully configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prioridadeLabel: Record<string, string> = {
      critica: "🔴 Crítica",
      alta: "🟠 Alta",
      media: "🟡 Média",
      baixa: "🟢 Baixa",
    };

    const categoriaLabel: Record<string, string> = {
      bug: "🐛 Bug",
      duvida: "❓ Dúvida",
      melhoria: "✨ Melhoria",
      urgencia: "🚨 Urgência",
    };

    const shortId = ticketId ? ticketId.substring(0, 8).toUpperCase() : ticketNumero;

    // Message to user
    const userMessage = `Olá, ${userName || "usuário"}! Seu chamado #${shortId} foi aberto com sucesso.

Título: ${titulo}
Fluxo: ${fluxo || "N/A"}
Categoria: ${categoriaLabel[categoria] || categoria}
Prioridade: ${prioridadeLabel[prioridade] || prioridade}
SLA: ${slaHoras}h

Acompanhe o status pelo painel ou por aqui. Responderemos em breve!

RBR Consult`;

    // Message to central
    const centralMessage = `*NOVO CHAMADO #${shortId}*

Aberto por: ${userName || "N/A"}
Título: ${titulo}
Fluxo: ${fluxo || "N/A"}
Plataforma: ${plataforma || "N/A"}
Cliente: ${clienteNome || "N/A"} - ${clienteTelefone || "N/A"}
Categoria: ${categoriaLabel[categoria] || categoria}
Prioridade: ${prioridadeLabel[prioridade] || prioridade}
SLA: ${slaHoras}h

Descrição: ${descricao}`;

    const sendMessage = async (number: string, text: string) => {
      const url = `${apiUrl}/message/sendText/${encodeURIComponent(instanceName)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number,
          text,
        }),
      });
      const data = await response.json();
      return { status: response.status, data };
    };

    const results: Record<string, unknown> = {};

    // Send to user if phone provided
    if (userPhone) {
      const cleanPhone = userPhone.replace(/\D/g, "");
      if (cleanPhone.length >= 10) {
        const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
        try {
          results.user = await sendMessage(phoneWithCountry, userMessage);
        } catch (e) {
          console.error("Error sending to user:", e);
          results.user = { error: String(e) };
        }
      }
    }

    // Send to central
    if (centralNumber) {
      try {
        results.central = await sendMessage(centralNumber, centralMessage);
      } catch (e) {
        console.error("Error sending to central:", e);
        results.central = { error: String(e) };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-ticket-whatsapp:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
