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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const makeApiKey = (Deno.env.get("MAKE_API_KEY") || "").trim();
    const dataStoreId = (Deno.env.get("MAKE_COMERCIAL_DATASTORE_ID") || "").trim();

    if (!makeApiKey || !dataStoreId) {
      return new Response(
        JSON.stringify({ error: "Make.com credentials not configured for comercial DS" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allRecords: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const apiUrl = `https://us2.make.com/api/v2/data-stores/${dataStoreId}/data?pg[limit]=${limit}&pg[offset]=${offset}`;
      
      const makeRes = await fetch(apiUrl, {
        headers: {
          "Authorization": `Token ${makeApiKey}`,
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

    console.log(`fetch-make-comercial: ${allRecords.length} records fetched`);

    return new Response(
      JSON.stringify({ data: allRecords, count: allRecords.length, lastUpdate: new Date().toISOString() }),
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
