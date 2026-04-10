SELECT cron.unschedule(3);

SELECT cron.schedule(
  'sync-make-errors-daily-2325',
  '25 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://xffzjdulkdgyicsllznp.supabase.co/functions/v1/fetch-make-errors',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZnpqZHVsa2RneWljc2xsem5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTE4NDcsImV4cCI6MjA4MDc4Nzg0N30.lcvBSUXNocIPAyVforz5zf2GIJdnIO41XFJue_1MzxA"}'::jsonb,
    body:='{"time": "now"}'::jsonb
  ) AS request_id;
  $$
);