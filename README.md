# ⚡ FORESYNTH

> **Intelligence for the Prediction Economy** — A full-stack analytics platform that gives Polymarket traders a decisive edge by surfacing smart-money signals, tracking whale wallets, and delivering real-time alerts before the market prices them in.

![Platform Preview](https://foresynthai.vercel.app)

---

## 🚀 What is Foresynth?

Foresynth is a real-time trading intelligence platform built exclusively on top of the [Polymarket](https://polymarket.com) prediction market ecosystem. It helps traders identify high-conviction opportunities by monitoring on-chain activity, detecting anomalous trading patterns from fresh wallets, and tracking the moves of the market's most profitable participants.

The platform is built as a **progressive experience** — anyone can explore public market data, leaderboards, and the anomaly radar without an account. Creating an account unlocks personalized features like watchlists, smart money squads, and AI-powered alerts.

---

## ✨ Features

### 🔍 Anomaly Radar
Detects statistically unusual trades from fresh wallets — historically the strongest leading indicator of alpha on prediction markets. Each signal is scored by a **Radar Score™** algorithm that factors in:
- Wallet age (days since first on-chain activity)
- Speed of trade entry relative to market creation
- Trade size and market concentration
- Historical win rate and P&L

### 🐋 Smart Money Console
Surfaces the most profitable wallets on Polymarket by historical ROI and win rate, organized into a live **global leaderboard**. Users can deep-dive into any wallet's open positions, trade history, and specialization by market category.

### 🎯 Target Squad System
Build a personal watchlist of smart-money wallets you want to shadow. Each "squad" can be configured with custom alert filters:
- Minimum trade size threshold
- Buy-only or sell-only orders
- Specific market categories
- Notification channels (in-app or Telegram)

### 📋 Signal Watchlists
Create persistent market watchlists across any Polymarket category — politics, sports, economics, crypto, and more. Set granular **price alerts** (e.g., "notify me when this market crosses 70%") to automate your signal monitoring.

### 📰 News Intelligence
A curated real-time news feed surfacing the breaking stories most likely to impact active prediction markets, helping users connect news catalysts to price movements.

### 🤖 Background Tactical Engine
A Python background service that runs on a 30-second polling cycle to:
- Monitor all tracked wallets for new on-chain trade activity
- Check all active price alerts against live Polymarket prices
- Push structured intelligence notifications via in-app feed and Telegram

### 🔔 Intel Feed (Notifications)
A real-time in-app notification center that displays structured alerts for:
- `wallet_alert` — A tracked smart money wallet just made a trade
- `price_alert` — A market you're monitoring hit your price target

---

## 🏗️ Architecture

Foresynth is a monorepo with three independent applications:

```
foresynth/
├── apps/
│   ├── web/          # Next.js 16 Frontend (Vercel)
│   ├── api/          # Python FastAPI Backend (Render)
│   └── agent/        # LangGraph AI Agent Service (Render)
└── packages/         # Shared utilities
```

### Frontend (`apps/web`)
| Technology | Role |
|---|---|
| **Next.js 16** (App Router) | Framework |
| **TypeScript** | Language |
| **Tailwind CSS v4** | Styling |
| **Zustand** | State management |
| **Supabase SSR** | Auth & real-time DB |
| **Framer Motion** | Animations |

### Backend API (`apps/api`)
| Technology | Role |
|---|---|
| **Python / FastAPI** | REST API framework |
| **Supabase (PostgreSQL)** | Primary database |
| **Redis** | Caching & alert cooldowns |
| **Polymarket CLOB API** | On-chain market data |
| **Pipenv** | Dependency management |

**API Routers:**
- `/markets` — Search and fetch Polymarket markets
- `/watchlists` — CRUD for user watchlists and price alerts
- `/squads` — Smart money squad management
- `/signals` — Anomaly radar / insider signal feed
- `/intel` — News and intelligence feed
- `/notifications` — In-app notification system
- `/telegram` — Telegram bot connection
- `/agent` — AI agent communication bridge

### AI Agent (`apps/agent`)
| Technology | Role |
|---|---|
| **Python / FastAPI** | HTTP interface |
| **LangGraph** | Agent orchestration |
| **LangChain** | LLM toolchain |
| **uvicorn** | ASGI server |

---

## 🛠️ Local Development

### Prerequisites
- **Node.js** >= 20
- **pnpm** >= 9
- **Python** >= 3.11
- **Pipenv**
- **Redis** (running locally or via a cloud provider)
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/Douglas-Kiprop/foresynth.git
cd foresynth
pnpm install
```

### 2. Environment Variables

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Backend API** (`apps/api/.env`):
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
REDIS_URL=redis://localhost:6379
DEBUG=true
```

**AI Agent** (`apps/agent/.env`):
```env
OPENAI_API_KEY=your_openai_api_key
```

### 3. Database Setup

Run the migration script to create all required tables in Supabase:
```bash
cd apps/api
pipenv run python scripts/migrate.py
```

### 4. Run Services

**Frontend** (port 3000):
```bash
cd apps/web
pnpm dev
```

**Backend API** (port 8000):
```bash
cd apps/api
pipenv run uvicorn src.main:app --reload --port 8000
```

**AI Agent** (port 8001):
```bash
cd apps/agent
pipenv run uvicorn src.main:app --reload --port 8001
```

---

## 🚀 Deployment

| Service | Platform | Notes |
|---|---|---|
| **Web Frontend** | [Vercel](https://vercel.com) | Auto-deploys from `main` branch |
| **Backend API** | [Render](https://render.com) | Free tier, configured via `render.yaml` |
| **AI Agent** | [Render](https://render.com) | Free tier, separate service |
| **Database** | [Supabase](https://supabase.com) | PostgreSQL + Auth + Realtime |
| **Cache** | Redis | Via Render or Upstash |

### Vercel Environment Variables
Set these in your Vercel project settings:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL   # Your Render backend URL + /api/v1
```

---

## 🔐 Authentication

Foresynth uses **Supabase Auth** with a progressive model:
- **Public access** — Leaderboard, News, Anomaly Radar, Market Search
- **Protected (prompt to sign up)** — Watchlists, Target Squads, Price Alerts, AI Agent

After signing up, users receive a confirmation email. The magic link callback is handled at `/auth/callback` and dynamically resolves to the correct domain (local or production).

---

## 📊 Database Schema

Core tables in Supabase:

| Table | Description |
|---|---|
| `watchlists` | User-created market monitoring lists |
| `watchlist_markets` | Markets associated with each watchlist |
| `price_alerts` | Configurable price threshold alerts |
| `squads` | Named groups of tracked smart money wallets |
| `tracked_targets` | Individual wallet targets within a squad |
| `notifications` | In-app notification feed per user |
| `insider_signals` | Scored anomalous trades from the radar engine |

---

## 🤝 Built On

- [Polymarket CLOB API](https://docs.polymarket.com) — On-chain prediction market data
- [Supabase](https://supabase.com) — Auth, database, and real-time
- [Next.js](https://nextjs.org) — React framework
- [LangGraph](https://langchain-ai.github.io/langgraph/) — AI agent orchestration

---

## 📄 License

MIT © [Douglas Kiprop](https://github.com/Douglas-Kiprop)
