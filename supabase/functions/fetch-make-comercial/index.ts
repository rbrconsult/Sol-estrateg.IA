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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse optional body for org override (super admin)
    let orgOverride: string | null = null;
    try {
      const body = await req.json();
      if (body?.org_id) orgOverride = String(body.org_id);
    } catch {
      // No body or invalid JSON — that's fine
    }

    // User-scoped client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Admin client (bypasses RLS)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authUser.id;

    // Check if super_admin
    const { data: isSuperAdmin } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: "super_admin",
    });

    // Determine which org to filter by
    let targetOrgId: string | null = null;

    if (isSuperAdmin && orgOverride) {
      targetOrgId = orgOverride;
    } else if (isSuperAdmin && !orgOverride) {
      targetOrgId = null;
    } else {
      const { data: orgId } = await adminClient.rpc("get_user_org", { p_user_id: userId });
      targetOrgId = orgId;
    }

    // ── Get allowed responsavel names/IDs from time_comercial ──
    let allowedNames: string[] = [];
    let allowedIds: string[] = [];

    if (targetOrgId) {
      // Get the org slug from organizations table
      const { data: orgData } = await adminClient
        .from("organizations")
        .select("slug")
        .eq("id", targetOrgId)
        .single();

      const orgSlug = orgData?.slug;

      if (orgSlug) {
        // Query time_comercial by franquia_id (slug) — only active members
        const { data: teamMembers } = await adminClient
          .from("time_comercial")
          .select("nome, sm_id, krolik_id")
          .eq("franquia_id", orgSlug)
          .eq("ativo", true);

        for (const m of teamMembers || []) {
          if (m.sm_id) allowedIds.push(String(m.sm_id));
          if (m.nome) allowedNames.push(m.nome.trim().toLowerCase());
        }
      }

      // Security: non-admin with no responsaveis configured = empty result
      if (allowedIds.length === 0 && allowedNames.length === 0 && !isSuperAdmin) {
        console.log(`fetch-make-comercial: no team members for org ${targetOrgId} (slug: ${orgData?.slug}), returning empty`);
        return new Response(
          JSON.stringify({ data: [], count: 0, lastUpdate: new Date().toISOString() }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get Make API credentials — try org-specific first, fallback to global
    let makeApiKey = "";
    let dataStoreId = "";
    const configOrgId = targetOrgId || null;

    if (configOrgId) {
      const { data: orgConfigs } = await adminClient
        .from("organization_configs")
        .select("config_key, config_value")
        .eq("organization_id", configOrgId)
        .in("config_key", ["make_api_key", "ds_comercial"]);

      for (const c of orgConfigs || []) {
        if (c.config_key === "make_api_key") makeApiKey = c.config_value.trim();
        if (c.config_key === "ds_comercial") dataStoreId = c.config_value.trim();
      }
    }

    // Fallback to global secrets
    if (!makeApiKey) makeApiKey = (Deno.env.get("MAKE_API_KEY") || "").trim();
    if (!dataStoreId) dataStoreId = (Deno.env.get("MAKE_COMERCIAL_DATASTORE_ID") || "").trim();
    const makeTeamId = (Deno.env.get("MAKE_TEAM_ID") || "1437295").trim();

    if (!makeApiKey || !dataStoreId) {
      return new Response(
        JSON.stringify({ error: "Make.com credentials not configured for comercial DS" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all records from Make Data Store
    const allRecords: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const apiUrl = `https://us2.make.com/api/v2/data-stores/${dataStoreId}/data?teamId=${makeTeamId}&pg[limit]=${limit}&pg[offset]=${offset}`;

      const authValue = makeApiKey.startsWith("Token ") ? makeApiKey : `Token ${makeApiKey}`;
      const makeRes = await fetch(apiUrl, {
        headers: {
          "Authorization": authValue,
          "Content-Type": "application/json",
        },
      });

      if (!makeRes.ok) {
        const errorText = await makeRes.text();
        console.error("Make API error:", makeRes.status, errorText);
        return new Response(
          JSON.stringify({ error: `Make API error: ${makeRes.status}`, details: errorText }),
          { status: makeRes.status || 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const makeData = await makeRes.json();
      const records = makeData?.records || makeData?.data || [];
      if (Array.isArray(records)) {
        allRecords.push(...records);
      }

      hasMore = Array.isArray(records) && records.length === limit;
      offset += limit;
    }

    // Filter by responsavel name/ID from time_comercial
    let filteredRecords = allRecords;
    if (allowedIds.length > 0 || allowedNames.length > 0) {
      filteredRecords = allRecords.filter((r) => {
        const d = r.data || r;
        const respName = String(d.responsavel || "").toLowerCase().trim();
        const respId = String(d.responsavel_id || d.representante_id || "").trim();
        const representante = String(d.representante || "").toLowerCase().trim();
        // Match by name
        if (allowedNames.length > 0) {
          if (respName && allowedNames.includes(respName)) return true;
          if (representante && allowedNames.includes(representante)) return true;
        }
        // Match by numeric ID (sm_id)
        if (respId && allowedIds.includes(respId)) return true;
        // Fuzzy fallback
        if (allowedNames.length > 0 && respName) {
          if (allowedNames.some(n => n.includes(respName) || respName.includes(n))) return true;
        }
        return false;
      });
      console.log(`fetch-make-comercial: ${allRecords.length} total → ${filteredRecords.length} filtered (org: ${targetOrgId}, names: ${allowedNames.length}, ids: ${allowedIds.length})`);
    } else {
      console.log(`fetch-make-comercial: ${allRecords.length} records (no filter, global/super_admin)`);
    }

    return new Response(
      JSON.stringify({ data: filteredRecords, count: filteredRecords.length, lastUpdate: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fetch-make-comercial error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
