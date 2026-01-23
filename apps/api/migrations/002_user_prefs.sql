
-- Add notification preferences to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB 
DEFAULT '{"min_trade_size": 1000, "price_change_threshold": 5, "notify_wallet_activity": true, "notify_price_alerts": true}';

-- Update RLS if necessary (already enabled for users)
