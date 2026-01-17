-- Foresynth Database Schema
-- Run this in Supabase SQL Editor to initialize tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Links to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    telegram_chat_id TEXT,
    discord_webhook_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Watchlists
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    market_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);

-- 3. Squads (Target Groups)
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_squads_user_id ON public.squads(user_id);

-- 4. Tracked Targets (Wallets in squads)
CREATE TABLE IF NOT EXISTS public.tracked_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    squad_id UUID REFERENCES public.squads ON DELETE CASCADE NOT NULL,
    wallet_address TEXT NOT NULL,
    nickname TEXT,
    alert_config JSONB DEFAULT '{"min_trade_size": 1000, "only_buy_orders": true, "channels": ["in-app"]}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracked_targets_squad_id ON public.tracked_targets(squad_id);
CREATE INDEX IF NOT EXISTS idx_tracked_targets_wallet ON public.tracked_targets(wallet_address);

-- 5. Notifications Log (In-App)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('price_alert', 'wallet_alert', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- 6. Insider Signals (Public Data)
CREATE TABLE IF NOT EXISTS public.insider_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    market_id TEXT NOT NULL,
    market_title TEXT,
    side TEXT CHECK (side IN ('YES', 'NO')),
    trade_size NUMERIC,
    price_entry NUMERIC,
    radar_score INTEGER CHECK (radar_score >= 0 AND radar_score <= 100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_insider_signals_score ON public.insider_signals(radar_score DESC);
CREATE INDEX IF NOT EXISTS idx_insider_signals_wallet ON public.insider_signals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_insider_signals_created ON public.insider_signals(created_at DESC);

-- 7. Price Alerts (for watchlist markets)
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    market_id TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    threshold NUMERIC NOT NULL CHECK (threshold >= 0 AND threshold <= 100),
    channels TEXT[] DEFAULT '{"in-app"}',
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_market ON public.price_alerts(market_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.price_alerts(is_active) WHERE is_active = TRUE;

-- Row Level Security policies (basic, can be expanded)
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to insider signals
ALTER TABLE public.insider_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public signals are viewable by everyone" ON public.insider_signals FOR SELECT USING (TRUE);

-- Grant permissions (for service role - full access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
