import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Accept: service role key, anon JWT, or webhook secret
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
    const webhookSecret = (Deno.env.get("CAMPAIGN_WEBHOOK_SECRET") || "").trim();

    let isAuthorized = token === serviceRoleKey;

    // Check webhook secret header
    const xWebhookSecret = req.headers.get("x-webhook-secret") || "";
    if (!isAuthorized && webhookSecret && xWebhookSecret === webhookSecret) {
      isAuthorized = true;
    }

    // Accept valid JWTs
    if (!isAuthorized && token.includes(".")) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role === "anon" && payload.iss?.includes("supabase")) isAuthorized = true;
          if (payload.role === "authenticated" && payload.sub) isAuthorized = true;
        }
      } catch { /* invalid JWT */ }
    }

    // Also allow unauthenticated POST from Make (no auth) if webhook secret matches via query
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");
    if (!isAuthorized && webhookSecret && querySecret === webhookSecret) {
      isAuthorized = true;
    }

    // If no webhook secret is configured, allow all POST (Make.com default behavior)
    if (!isAuthorized && !webhookSecret) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type, organization_id, company_id, franquia_id, records } = body;

    if (!type || !Array.isArray(records) || records.length === 0) {
      return new Response(JSON.stringify({ error: "Missing type or records" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY_VAL = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY_VAL);

    // Resolve IDs — accept both old (organization_id) and new (company_id/franquia_id) formats
    const resolvedCompanyId = company_id || organization_id || "00000000-0000-0000-0000-000000000001";
    const resolvedFranquiaId = franquia_id || "evolve_olimpia";
    let upserted = 0;

    if (type === "campaign" || type === "google_ads") {
      // → ads_google_campaigns_daily
      const rows = records.map((r: any) => ({
        company_id: r.company_id || resolvedCompanyId,
        franquia_id: r.franquia_id || resolvedFranquiaId,
        customer_id: r.customer_id || r.external_account_id || "0",
        campaign_id: String(r.campaign_id || r.id || ""),
        campaign_name: r.campaign_name || r.name || r.campaign || "",
        campaign_status: r.campaign_status || null,
        campaign_type: r.campaign_type || null,
        objetivo: r.objetivo || r.plataforma || null,
        ad_group_id: r.ad_group_id || null,
        ad_group_name: r.ad_group_name || r.adset_name || r.ad_group || null,
        ad_id: r.ad_id || null,
        date: r.date || r.data_referencia || new Date().toISOString().slice(0, 10),
        impressions: parseInt(r.impressions) || 0,
        clicks: parseInt(r.clicks) || 0,
        cost: parseFloat(r.cost || r.spend) || 0,
        conversions: parseFloat(r.conversions) || 0,
        conversion_value: parseFloat(r.conversion_value || r.receita || r.revenue) || 0,
        ctr: parseFloat(r.ctr) || 0,
        cpc: parseFloat(r.cpc) || 0,
        cpm: parseFloat(r.cpm) || 0,
        roas: parseFloat(r.roas) || null,
        rede: r.rede || null,
        dispositivo: r.dispositivo || null,
        raw_payload: r.raw_data || r.raw_payload || r,
      }));

      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase
          .from("ads_google_campaigns_daily")
          .upsert(batch, {
            onConflict: "company_id,campaign_id,date",
            ignoreDuplicates: false,
          });
        if (error) {
          console.error("Google Ads upsert error:", error.message);
        } else {
          upserted += batch.length;
        }
      }
    } else if (type === "meta_ads") {
      // → ads_meta_campaigns_daily
      const rows = records.map((r: any) => ({
        company_id: r.company_id || resolvedCompanyId,
        franquia_id: r.franquia_id || resolvedFranquiaId,
        external_account_id: r.external_account_id || r.account_id || "act_0",
        campaign_id: String(r.campaign_id || r.id || ""),
        campaign_name: r.campaign_name || r.name || r.campaign || "",
        campaign_status: r.campaign_status || null,
        adset_id: r.adset_id || null,
        adset_name: r.adset_name || null,
        ad_id: String(r.ad_id || r.id || "0"),
        ad_name: r.ad_name || null,
        objetivo: r.objetivo || null,
        date: r.date || r.data_referencia || new Date().toISOString().slice(0, 10),
        impressions: parseInt(r.impressions) || 0,
        clicks: parseInt(r.clicks) || 0,
        spend: parseFloat(r.spend || r.cost) || 0,
        reach: parseInt(r.reach) || 0,
        frequency: parseFloat(r.frequency) || 0,
        leads: parseInt(r.leads) || 0,
        ctr: parseFloat(r.ctr) || 0,
        cpc: parseFloat(r.cpc) || 0,
        cpm: parseFloat(r.cpm) || 0,
        cpl: parseFloat(r.cpl || r.cost_per_lead) || 0,
        roas: parseFloat(r.roas) || null,
        receita_gerada: parseFloat(r.receita || r.receita_gerada || r.revenue) || 0,
        raw_payload: r.raw_data || r.raw_payload || r,
      }));

      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase
          .from("ads_meta_campaigns_daily")
          .upsert(batch, {
            onConflict: "company_id,campaign_id,ad_id,date",
            ignoreDuplicates: false,
          });
        if (error) {
          console.error("Meta Ads upsert error:", error.message);
        } else {
          upserted += batch.length;
        }
      }
    } else if (type === "ga4") {
      // → analytics_ga4_daily
      const rows = records.map((r: any) => ({
        company_id: r.company_id || resolvedCompanyId,
        franquia_id: r.franquia_id || resolvedFranquiaId,
        property_id: r.property_id || "0",
        date: r.date || r.data_referencia || new Date().toISOString().slice(0, 10),
        source: r.source || "(direct)",
        medium: r.medium || "(none)",
        campaign: r.campaign || "(not set)",
        landing_page: r.landing_page || r.page || "/",
        sessions: parseInt(r.sessions) || 0,
        users: parseInt(r.users || r.users_count) || 0,
        new_users: parseInt(r.new_users || r.newUsers) || 0,
        bounce_rate: parseFloat(r.bounce_rate || r.bounceRate) || 0,
        avg_session_duration: parseFloat(r.avg_session_duration || r.avgSessionDuration) || 0,
        pages_per_session: parseFloat(r.pages_per_session || r.pagesPerSession) || 0,
        conversions: parseInt(r.conversions) || 0,
        revenue: parseFloat(r.revenue) || 0,
        raw_payload: r.raw_data || r.raw_payload || r,
      }));

      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase
          .from("analytics_ga4_daily")
          .upsert(batch, {
            onConflict: "company_id,property_id,date,source,medium,campaign,landing_page",
            ignoreDuplicates: false,
          });
        if (error) {
          console.error("GA4 upsert error:", error.message);
        } else {
          upserted += batch.length;
        }
      }
    } else {
      return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`webhook-campaign-data: type=${type}, upserted=${upserted}`);

    return new Response(JSON.stringify({ success: true, upserted, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("webhook-campaign-data error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
