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
    const MAKE_API_TOKEN = Deno.env.get("MAKE_API_KEY");
    if (!MAKE_API_TOKEN) throw new Error("MAKE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const anonClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await anonClient.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Role check: only super_admin can execute Make actions
    const userId = claims.claims.sub;
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, executionId, recordId } = await req.json();

    if (!action || !executionId || !recordId) {
      return new Response(
        JSON.stringify({ error: "Missing action, executionId, or recordId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeHeaders = {
      Authorization: `Token ${MAKE_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    const MAKE_BASE = "https://us2.make.com/api/v2";

    if (action === "retry") {
      const res = await fetch(
        `${MAKE_BASE}/incomplete-executions/${executionId}/retry`,
        { method: "POST", headers: makeHeaders }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Retry failed [${res.status}]: ${errText}`);
      }
      await res.text();
    } else if (action === "discard") {
      const res = await fetch(
        `${MAKE_BASE}/incomplete-executions/${executionId}`,
        { method: "DELETE", headers: makeHeaders }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Discard failed [${res.status}]: ${errText}`);
      }
      await res.text();
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'retry' or 'discard'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update record in Supabase
    await supabase
      .from("make_errors")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", recordId);

    return new Response(
      JSON.stringify({ success: true, message: `Action '${action}' completed successfully.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("make-action error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
