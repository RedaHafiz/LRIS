-- ============================================
-- EMAIL NOTIFICATION SETUP
-- ============================================
-- This is a placeholder for email notification setup.
-- You'll need to set up one of these options:

-- OPTION 1: Use Supabase Edge Functions with Resend
-- 1. Sign up for Resend (https://resend.com)
-- 2. Create an Edge Function that listens for new notifications
-- 3. Send emails via Resend API when notifications are created

-- OPTION 2: Use Database Webhooks
-- 1. Go to Supabase Dashboard > Database > Webhooks
-- 2. Create webhook on notifications table INSERT
-- 3. Point to your email service endpoint

-- OPTION 3: Use pg_net (Supabase built-in)
-- Example function to call external email API:

-- CREATE OR REPLACE FUNCTION public.send_notification_email()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Get user email
--   DECLARE
--     user_email TEXT;
--   BEGIN
--     SELECT email INTO user_email FROM public.profiles WHERE id = NEW.user_id;
--     
--     -- Call external email service via pg_net
--     -- PERFORM net.http_post(
--     --   url := 'https://api.resend.com/emails',
--     --   headers := '{"Authorization": "Bearer YOUR_API_KEY", "Content-Type": "application/json"}',
--     --   body := json_build_object(
--     --     'from', 'notifications@yourplatform.com',
--     --     'to', user_email,
--     --     'subject', 'New Notification - Threat Assessment Platform',
--     --     'html', '<p>' || NEW.message || '</p>'
--     --   )::text
--     -- );
--     
--     RETURN NEW;
--   END;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER on_notification_created
--   AFTER INSERT ON public.notifications
--   FOR EACH ROW
--   WHEN (NEW.type = 'assignment')
--   EXECUTE FUNCTION public.send_notification_email();

-- NOTE: For production, use a proper email service like:
-- - Resend (recommended, easy setup)
-- - SendGrid
-- - AWS SES
-- - Postmark
