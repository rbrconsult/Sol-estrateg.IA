ALTER TABLE ads_meta_campaigns_daily ADD CONSTRAINT uq_meta_daily UNIQUE (franquia_id, campaign_id, ad_id, date);
ALTER TABLE ads_google_campaigns_daily ADD CONSTRAINT uq_google_daily UNIQUE (franquia_id, customer_id, campaign_id, date);
ALTER TABLE analytics_ga4_daily ADD CONSTRAINT uq_ga4_daily UNIQUE (franquia_id, property_id, date, source, medium, landing_page);