-- Agent Configuration and Decision Feed Tables
-- Run this in Supabase SQL Editor to enable the AI Agent features

-- 1. Agent Configurations (Per User)
CREATE TABLE IF NOT EXISTS public.agent_configs (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    risk_profile TEXT CHECK (risk_profile IN ('conservative', 'moderate', 'degen')) DEFAULT 'moderate',
    focus_sectors JSONB DEFAULT '["politics", "crypto", "pop_culture"]', -- Array of strings
    sources JSONB DEFAULT '["watchlists", "squads", "news"]', -- Array of strings
    notification_frequency TEXT DEFAULT 'realtime', -- realtime, hourly, daily
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agent Decisions (The Feed)
CREATE TABLE IF NOT EXISTS public.agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    market_question TEXT NOT NULL,
    market_slug TEXT,
    signal TEXT CHECK (signal IN ('BUY_YES', 'BUY_NO', 'HOLD', 'SKIP')),
    confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1.0),
    reasoning TEXT,
    key_factors JSONB DEFAULT '[]', -- Array of strings
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_decisions_user_id ON public.agent_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created_at ON public.agent_decisions(created_at DESC);

-- RLS
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
