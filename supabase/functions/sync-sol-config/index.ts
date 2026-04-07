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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accept optional list of keys to sync; if empty, sync all dirty rows
    const body = await req.json().catch(() => ({}));
    const requestedKeys: string[] | undefined = body.keys;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch dirty rows: updated_at > synced_at OR synced_at IS NULL
    let query = adminClient
      .from("sol_config_sync")
      .select("*")
      .or("synced_at.is.null,updated_at.gt.synced_at");

    if (requestedKeys?.length) {
      query = query.in("key", requestedKeys);
    }

    const { data: dirtyRows, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    if (!dirtyRows || dirtyRows.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, synced: 0, message: "Nothing to sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get DS ID from app_settings
    const { data: setting } = await adminClient
      .from("app_settings")
      .select("value")
      .eq("key", "make_ds_sol_config")
      .single();

    const dsId = setting?.value || "87419";

    const makeApiKey = Deno.env.get("MAKE_API_KEY");
    const teamId = Deno.env.get("MAKE_TEAM_ID") || "1934898";

    let syncedCount = 0;
    const errors: string[] = [];

    for (const row of dirtyRows) {
      try {
        const data: Record<string, unknown> = {
          valor_text: row.valor_text ?? "",
          counter: row.counter ?? 0,
          updated_by: row.updated_by ?? "lovable",
          updated_at: row.updated_at ?? new Date().toISOString(),
        };

        const makeRes = await fetch(
          `https://us2.make.com/api/v2/data-stores/${dsId}/data?teamId=${teamId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Token ${makeApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key: row.key, data }),
          }
        );

        const makeResult = await makeRes.text();
        console.log(`Make sync [${row.key}]:`, makeRes.status, makeResult);

        if (!makeRes.ok) {
          errors.push(`${row.key}: Make ${makeRes.status}`);
          continue;
        }

        // Mark as synced locally
        const { error: updateErr } = await adminClient
          .from("sol_config_sync")
          .update({ synced_at: new Date().toISOString() })
          .eq("key", row.key);

        if (updateErr) {
          console.error(`synced_at update error [${row.key}]:`, updateErr.message);
        }

        syncedCount++;
      } catch (rowErr: unknown) {
        const msg = rowErr instanceof Error ? rowErr.message : "Unknown";
        errors.push(`${row.key}: ${msg}`);
        console.error(`Row sync error [${row.key}]:`, msg);
      }
    }

    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        synced: syncedCount,
        total: dirtyRows.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("sync-sol-config error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
