-- Add breakdowns & quality columns to ads_meta_campaigns_daily
ALTER TABLE public.ads_meta_campaigns_daily
  ADD COLUMN IF NOT EXISTS publisher_platform text,
  ADD COLUMN IF NOT EXISTS platform_position text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS video_views_3s integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p25 integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p50 integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p75 integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p100 integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_ranking text,
  ADD COLUMN IF NOT EXISTS engagement_ranking text,
  ADD COLUMN IF NOT EXISTS conversion_ranking text;

-- Add market intelligence columns to ads_google_campaigns_daily
ALTER TABLE public.ads_google_campaigns_daily
  ADD COLUMN IF NOT EXISTS campaign_type text,
  ADD COLUMN IF NOT EXISTS search_impression_share numeric,
  ADD COLUMN IF NOT EXISTS search_top_impression_pct numeric,
  ADD COLUMN IF NOT EXISTS search_abs_top_impression_pct numeric,
  ADD COLUMN IF NOT EXISTS search_budget_lost_share numeric,
  ADD COLUMN IF NOT EXISTS search_rank_lost_share numeric,
  ADD COLUMN IF NOT EXISTS quality_score integer,
  ADD COLUMN IF NOT EXISTS hora integer,
  ADD COLUMN IF NOT EXISTS dia_semana text;

-- Add extra dimensions to analytics_ga4_daily
ALTER TABLE public.analytics_ga4_daily
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS device_category text,
  ADD COLUMN IF NOT EXISTS bounce_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_session_duration numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pages_per_session numeric DEFAULT 0;