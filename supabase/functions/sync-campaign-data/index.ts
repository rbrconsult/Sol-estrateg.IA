import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FRANQUIA_ID = "evolve_olimpia";
const COMPANY_ID = "00000000-0000-0000-0000-000000000001";

// ─── Google OAuth refresh ───
async function refreshGoogleToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET")!;
  const refreshToken = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google OAuth refresh failed: ${err}`);
  }
  const { access_token } = await res.json();
  return access_token;
}

// ─── 1. Meta Ads (with breakdowns, quality rankings, video metrics) ───
async function syncMetaAds(supabase: any): Promise<{ upserted: number; errors: string[] }> {
  const token = Deno.env.get("META_ACCESS_TOKEN");
  if (!token) return { upserted: 0, errors: ["META_ACCESS_TOKEN not configured"] };

  const yesterday = getYesterday();
  
  // Fetch at ad level with full fields + breakdowns
  const fields = [
    "campaign_id", "campaign_name", "campaign_id", 
    "adset_id", "adset_name",
    "ad_id", "ad_name",
    "spend", "impressions", "clicks", "reach", "frequency",
    "ctr", "cpm", "cpc",
    "actions", "cost_per_action_type", "action_values",
    "video_avg_time_watched_actions",
    "video_p25_watched_actions", "video_p50_watched_actions",
    "video_p75_watched_actions", "video_p100_watched_actions",
    "quality_ranking", "engagement_rate_ranking", "conversion_rate_ranking",
  ].join(",");

  const allRows: any[] = [];
  
  // Fetch with publisher_platform breakdown for platform-level data
  for (const breakdown of ["", "publisher_platform,platform_position"]) {
    const url = new URL("https://graph.facebook.com/v21.0/act_431437131828239/insights");
    url.searchParams.set("fields", fields);
    url.searchParams.set("time_range", JSON.stringify({ since: yesterday, until: yesterday }));
    url.searchParams.set("level", "ad");
    url.searchParams.set("limit", "500");
    if (breakdown) url.searchParams.set("breakdowns", breakdown);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      // If breakdown fails, skip (not all accounts support all breakdowns)
      if (breakdown) {
        console.warn(`Meta breakdown ${breakdown} failed: ${err}`);
        continue;
      }
      return { upserted: 0, errors: [`Meta API ${res.status}: ${err}`] };
    }

    const json = await res.json();
    const data = json.data || [];

    for (const r of data) {
      const getAction = (type: string) => (r.actions || []).find((a: any) => a.action_type === type)?.value || 0;
      const getCostPerAction = (type: string) => (r.cost_per_action_type || []).find((a: any) => a.action_type === type)?.value || 0;
      const getVideoWatched = (field: string) => {
        const arr = r[field] || [];
        return arr.reduce((sum: number, v: any) => sum + (parseInt(v.value) || 0), 0);
      };

      allRows.push({
        company_id: COMPANY_ID,
        franquia_id: FRANQUIA_ID,
        date: yesterday,
        campaign_id: r.campaign_id,
        campaign_name: r.campaign_name,
        adset_id: r.adset_id || null,
        adset_name: r.adset_name || null,
        ad_id: r.ad_id || `${r.campaign_id}_agg`,
        ad_name: r.ad_name || null,
        spend: parseFloat(r.spend) || 0,
        impressions: parseInt(r.impressions) || 0,
        clicks: parseInt(r.clicks) || 0,
        reach: parseInt(r.reach) || 0,
        frequency: parseFloat(r.frequency) || 0,
        ctr: parseFloat(r.ctr) || 0,
        cpm: parseFloat(r.cpm) || 0,
        cpc: parseFloat(r.cpc) || 0,
        leads: parseInt(getAction("lead")) || 0,
        cpl: parseFloat(getCostPerAction("lead")) || null,
        // Video metrics
        video_views_3s: getVideoWatched("video_avg_time_watched_actions"),
        video_p25: getVideoWatched("video_p25_watched_actions"),
        video_p50: getVideoWatched("video_p50_watched_actions"),
        video_p75: getVideoWatched("video_p75_watched_actions"),
        video_p100: getVideoWatched("video_p100_watched_actions"),
        // Quality rankings
        quality_ranking: r.quality_ranking || null,
        engagement_ranking: r.engagement_rate_ranking || null,
        conversion_ranking: r.conversion_rate_ranking || null,
        // Breakdowns
        publisher_platform: r.publisher_platform || null,
        platform_position: r.platform_position || null,
        // ROAS
        roas: (() => {
          const purchaseValue = (r.action_values || []).find(
            (a: any) => a.action_type === "offsite_conversion.fb_pixel_purchase"
          )?.value;
          const spend = parseFloat(r.spend) || 0;
          return purchaseValue && spend > 0 ? parseFloat(purchaseValue) / spend : null;
        })(),
        receita_gerada: (() => {
          const purchaseValue = (r.action_values || []).find(
            (a: any) => a.action_type === "offsite_conversion.fb_pixel_purchase"
          )?.value;
          return purchaseValue ? parseFloat(purchaseValue) : 0;
        })(),
        raw_payload: r,
        updated_at: new Date().toISOString(),
      });
    }

    // Only process the first (no-breakdown) call if breakdown also succeeds
    if (!breakdown && data.length > 0) continue;
  }

  // Deduplicate: if we have breakdown rows, prefer them; otherwise use base rows
  const uniqueKey = (r: any) => `${r.campaign_id}|${r.ad_id}|${r.publisher_platform || ''}|${r.platform_position || ''}`;
  const deduped = new Map<string, any>();
  for (const row of allRows) {
    const key = uniqueKey(row);
    if (!deduped.has(key) || (row.publisher_platform && !deduped.get(key).publisher_platform)) {
      deduped.set(key, row);
    }
  }
  const finalRows = [...deduped.values()];

  if (!finalRows.length) return { upserted: 0, errors: [] };

  let upserted = 0;
  const errors: string[] = [];
  for (let i = 0; i < finalRows.length; i += 50) {
    const batch = finalRows.slice(i, i + 50);
    const { error } = await supabase
      .from("ads_meta_campaigns_daily")
      .upsert(batch, { onConflict: "franquia_id,campaign_id,ad_id,date" });
    if (error) errors.push(`Meta upsert: ${error.message}`);
    else upserted += batch.length;
  }
  return { upserted, errors };
}

// ─── 2. Google Ads (with market intelligence) ───
async function syncGoogleAds(supabase: any, googleToken: string): Promise<{ upserted: number; errors: string[] }> {
  const customerId = "5699577570";
  const devToken = "20f6773a96e4285ed577843bfada1f40fd5f47a8";

  const query = `
    SELECT 
      campaign.id, campaign.name, campaign.status,
      campaign.advertising_channel_type,
      metrics.cost_micros, metrics.impressions, metrics.clicks, 
      metrics.conversions, metrics.conversions_value,
      metrics.cost_per_conversion,
      metrics.ctr, metrics.average_cpc, metrics.average_cpm,
      metrics.search_impression_share,
      metrics.search_top_impression_percentage,
      metrics.search_absolute_top_impression_percentage,
      metrics.search_budget_lost_impression_share,
      metrics.search_rank_lost_impression_share,
      segments.date, segments.device, segments.day_of_week, segments.hour
    FROM campaign 
    WHERE segments.date DURING YESTERDAY 
      AND campaign.status != 'REMOVED'
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${googleToken}`,
        "developer-token": devToken,
        "login-customer-id": customerId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return { upserted: 0, errors: [`Google Ads API ${res.status}: ${err}`] };
  }

  const json = await res.json();
  const results = Array.isArray(json) ? json : [json];
  const allRows: any[] = [];

  for (const batch of results) {
    for (const result of batch.results || []) {
      const c = result.campaign || {};
      const m = result.metrics || {};
      const s = result.segments || {};

      allRows.push({
        company_id: COMPANY_ID,
        franquia_id: FRANQUIA_ID,
        customer_id: customerId,
        date: s.date,
        campaign_id: String(c.id),
        campaign_name: c.name || "",
        campaign_status: c.status || "",
        campaign_type: c.advertisingChannelType || "",
        objetivo: c.advertisingChannelType || "",
        dispositivo: s.device || "",
        dia_semana: s.dayOfWeek || "",
        hora: parseInt(s.hour) || 0,
        cost: (parseInt(m.costMicros) || 0) / 1_000_000,
        impressions: parseInt(m.impressions) || 0,
        clicks: parseInt(m.clicks) || 0,
        conversions: parseFloat(m.conversions) || 0,
        conversion_value: parseFloat(m.conversionsValue) || 0,
        cost_per_conversion: (parseInt(m.costPerConversion) || 0) / 1_000_000,
        ctr: parseFloat(m.ctr) || 0,
        cpc: (parseInt(m.averageCpc) || 0) / 1_000_000,
        cpm: (parseInt(m.averageCpm) || 0) / 1_000_000,
        // Market intelligence
        search_impression_share: parseFloat(m.searchImpressionShare) || null,
        search_top_impression_pct: parseFloat(m.searchTopImpressionPercentage) || null,
        search_abs_top_impression_pct: parseFloat(m.searchAbsoluteTopImpressionPercentage) || null,
        search_budget_lost_share: parseFloat(m.searchBudgetLostImpressionShare) || null,
        search_rank_lost_share: parseFloat(m.searchRankLostImpressionShare) || null,
        roas: (() => {
          const cost = (parseInt(m.costMicros) || 0) / 1_000_000;
          const value = parseFloat(m.conversionsValue) || 0;
          return cost > 0 ? value / cost : null;
        })(),
        raw_payload: result,
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (!allRows.length) return { upserted: 0, errors: [] };

  let upserted = 0;
  const errors: string[] = [];
  for (let i = 0; i < allRows.length; i += 50) {
    const batch = allRows.slice(i, i + 50);
    const { error } = await supabase
      .from("ads_google_campaigns_daily")
      .upsert(batch, { onConflict: "franquia_id,customer_id,campaign_id,date" });
    if (error) errors.push(`Google Ads upsert: ${error.message}`);
    else upserted += batch.length;
  }
  return { upserted, errors };
}

// ─── 3. GA4 (with city, device, bounce rate, duration, pages/session) ───
async function syncGA4(supabase: any, googleToken: string): Promise<{ upserted: number; errors: string[] }> {
  const propertyId = "323312207";
  const yesterday = getYesterday();

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${googleToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: yesterday, endDate: yesterday }],
        dimensions: [
          { name: "date" },
          { name: "sessionSource" },
          { name: "sessionMedium" },
          { name: "pagePath" },
          { name: "city" },
          { name: "deviceCategory" },
        ],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "bounceRate" },
          { name: "conversions" },
          { name: "engagedSessions" },
          { name: "averageSessionDuration" },
          { name: "screenPageViewsPerSession" },
        ],
        limit: "10000",
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return { upserted: 0, errors: [`GA4 API ${res.status}: ${err}`] };
  }

  const json = await res.json();
  const rows: any[] = [];

  for (const row of json.rows || []) {
    const dims = row.dimensionValues || [];
    const mets = row.metricValues || [];
    const dateRaw = dims[0]?.value || yesterday.replace(/-/g, "");
    const dateFormatted = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;

    rows.push({
      company_id: COMPANY_ID,
      franquia_id: FRANQUIA_ID,
      property_id: propertyId,
      date: dateFormatted,
      source: dims[1]?.value || "(direct)",
      medium: dims[2]?.value || "(none)",
      landing_page: dims[3]?.value || "/",
      city: dims[4]?.value || null,
      device_category: dims[5]?.value || null,
      sessions: parseInt(mets[0]?.value) || 0,
      users: parseInt(mets[1]?.value) || 0,
      new_users: parseInt(mets[2]?.value) || 0,
      bounce_rate: parseFloat(mets[3]?.value) || 0,
      conversions: parseInt(mets[4]?.value) || 0,
      engaged_sessions: parseInt(mets[5]?.value) || 0,
      avg_session_duration: parseFloat(mets[6]?.value) || 0,
      pages_per_session: parseFloat(mets[7]?.value) || 0,
      raw_payload: row,
      updated_at: new Date().toISOString(),
    });
  }

  if (!rows.length) return { upserted: 0, errors: [] };

  let upserted = 0;
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("analytics_ga4_daily")
      .upsert(batch, { onConflict: "franquia_id,property_id,date,source,medium,landing_page" });
    if (error) errors.push(`GA4 upsert: ${error.message}`);
    else upserted += batch.length;
  }
  return { upserted, errors };
}

// ─── Helpers ───
function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function logRun(supabase: any, name: string, status: string, rows: number, error?: string) {
  await supabase.from("integration_runs").insert({
    integration_name: name,
    franquia_id: FRANQUIA_ID,
    status,
    rows_upserted: rows,
    error_message: error || null,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  });
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const summary: Record<string, any> = {};

    // 1. Meta Ads
    try {
      const meta = await syncMetaAds(supabase);
      summary.meta_ads = meta;
      await logRun(supabase, "sync-meta-ads", meta.errors.length ? "partial" : "success", meta.upserted, meta.errors.join("; "));
    } catch (e: any) {
      summary.meta_ads = { error: e.message };
      await logRun(supabase, "sync-meta-ads", "error", 0, e.message);
    }

    // 2 & 3. Google Ads + GA4
    let googleToken = "";
    try {
      googleToken = await refreshGoogleToken();
    } catch (e: any) {
      summary.google_oauth = { error: e.message };
      await logRun(supabase, "sync-google-oauth", "error", 0, e.message);
    }

    if (googleToken) {
      try {
        const gads = await syncGoogleAds(supabase, googleToken);
        summary.google_ads = gads;
        await logRun(supabase, "sync-google-ads", gads.errors.length ? "partial" : "success", gads.upserted, gads.errors.join("; "));
      } catch (e: any) {
        summary.google_ads = { error: e.message };
        await logRun(supabase, "sync-google-ads", "error", 0, e.message);
      }

      try {
        const ga4 = await syncGA4(supabase, googleToken);
        summary.ga4 = ga4;
        await logRun(supabase, "sync-ga4", ga4.errors.length ? "partial" : "success", ga4.upserted, ga4.errors.join("; "));
      } catch (e: any) {
        summary.ga4 = { error: e.message };
        await logRun(supabase, "sync-ga4", "error", 0, e.message);
      }
    }

    console.log("sync-campaign-data complete:", JSON.stringify(summary));

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("sync-campaign-data fatal:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
