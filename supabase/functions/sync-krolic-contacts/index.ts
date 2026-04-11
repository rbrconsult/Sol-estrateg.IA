import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KROLIC_API = "https://api.camkrolik.com.br/core/v2/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Krolic API key from app_settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["krolic_api_token"]);

    const apiKey = settings?.find((s: any) => s.key === "krolic_api_token")?.value;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "krolic_api_token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active sectors from equipe
    const { data: equipe } = await supabase
      .from("sol_equipe_sync")
      .select("krolik_setor_id, franquia_id")
      .eq("ativo", true)
      .eq("krolik_ativo", true);

    const sectorIds = [...new Set((equipe || []).map((e: any) => e.krolik_setor_id).filter(Boolean))];
    const franquiaId = equipe?.[0]?.franquia_id || "evolve_olimpia";

    if (sectorIds.length === 0) {
      return new Response(JSON.stringify({ error: "No active sectors found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch contacts from each sector
    const allContacts: { telefone: string; krolic_id: string; nome: string; setor_id: string }[] = [];

    for (const sectorId of sectorIds) {
      let offset = 0;
      const limit = 100;
      while (true) {
        const url = `${KROLIC_API}/contacts?sectorId=${sectorId}&limit=${limit}&skip=${offset}`;
        const res = await fetch(url, {
          headers: { "access-token": apiKey },
        });
        if (!res.ok) {
          console.error(`Krolic API error: ${res.status} for sector ${sectorId}`);
          break;
        }
        const contacts = await res.json();
        if (!Array.isArray(contacts) || contacts.length === 0) break;

        for (const c of contacts) {
          const phone = (c.number || "").replace(/\D/g, "");
          if (!phone || phone.length < 10) continue;
          allContacts.push({
            telefone: phone,
            krolic_id: c.id,
            nome: c.name || c.nameFromWhatsApp || "",
            setor_id: sectorId as string,
          });
        }

        if (contacts.length < limit) break;
        offset += limit;
      }
    }

    console.log(`[sync-krolic] Fetched ${allContacts.length} active contacts from ${sectorIds.length} sectors`);

    // Clear old contacts and insert fresh ones (full replace)
    await supabase.from("krolic_active_contacts").delete().eq("franquia_id", franquiaId);

    if (allContacts.length > 0) {
      const rows = allContacts.map((c) => ({
        ...c,
        franquia_id: franquiaId,
        synced_at: new Date().toISOString(),
      }));

      // Upsert in batches
      const batchSize = 100;
      let upserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase
          .from("krolic_active_contacts")
          .upsert(batch, { onConflict: "telefone", ignoreDuplicates: false });
        if (error) {
          console.error(`[sync-krolic] Upsert error:`, error.message);
        } else {
          upserted += batch.length;
        }
      }

      // Log to integration_runs
      await supabase.from("integration_runs").insert({
        integration_name: "sync-krolic-contacts",
        status: "success",
        rows_received: allContacts.length,
        rows_upserted: upserted,
        franquia_id: franquiaId,
        meta: { sectors: sectorIds },
      });

      return new Response(JSON.stringify({ success: true, contacts: upserted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, contacts: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sync-krolic] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
