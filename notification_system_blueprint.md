# Notification System & Authentication Blueprint

## Executive Summary
You are correct: **Authentication is a strict prerequisite** for this feature. We cannot securely link a specific Telegram account to a Foresynth user without knowing who the user is.

This blueprint outlines a two-phase implementation plan:
1.  **Authentication Layer (Supabase Auth)**: Secure the app and provide user identity.
2.  **Notification Engine (Telegram Integration)**: Link authenticated users to Telegram bots for real-time alerts.

---

## Phase 1: Authentication Infrastructure
We will use **Supabase Auth** since we are already using Supabase for the database. It is secure, scales well, and integrates natively with our stack.

### 1.1 Backend (FastAPI)
*   **Dependency**: Create a reusable `get_current_user` dependency in `src/core/security.py`.
    *   This will verify the JWT (JSON Web Token) sent by the frontend against Supabase's secret.
*   **Middleware**: Protect all `/squads/*` and `/notifications/*` endpoints.
*   **Database**:
    *   Supabase automatically manages the `auth.users` table.
    *   We will create a `public.profiles` table (linked via triggers) to store app-specific settings (like `telegram_chat_id`).

### 1.2 Frontend (Next.js)
*   **Auth Pages**: Create `/login` and `/signup` pages using generic UI components.
*   **Middleware**: Protect `/smart-money`, `/watchlists`, and `/account` routes.
*   **State Management**: Use a hook `useAuth()` to expose the user session globally.

---

## Phase 2: Telegram Notification Engine

### 2.1 The "Deep Link" Linking Flow
This is the standard, secure way to link accounts.

1.  **User Action**: User clicks "Connect Telegram" in Foresynth settings.
2.  **Token Generation**:
    *   Frontend requests a unique **Start Token** from Backend.
    *   Backend generates a short-lived unique ID (e.g., `uuid`) and temporarily associates it with the `user_id` in Redis or DB.
3.  **Redirection**:
    *   Frontend redirects user to `https://t.me/ForesynthBot?start=<start_token>`.
4.  **Bot Activation**:
    *   User clicks "Start" in Telegram app.
    *   Telegram client sends `/start <start_token>` message to our Bot.
5.  **Verification (The "Handshake")**:
    *   Our Backend Webhook receives the message.
    *   It extracts the `<start_token>`.
    *   It looks up the corresponding `user_id`.
    *   It saves the **Telegram Chat ID** to the `public.profiles` table for that user.
    *   Bot replies: *"Connected! You will now receive alerts here."*

### 2.2 Notification Dispatcher Service
We will upgrade the `NotificationService` to be "Channel Aware".

*   **Logic**:
    ```python
    async def send_notification(user_id, message):
        # 1. In-App (Default)
        save_to_database(user_id, message)
        
        # 2. Telegram (If enabled)
        profile = get_user_profile(user_id)
        if profile.telegram_chat_id:
            await telegram_bot.send_message(profile.telegram_chat_id, message)
    ```

---

## User Guide: How to Setup the Telegram Bot
Before we write code, you need to register a bot with Telegram. This takes 2 minutes.

### Step-by-Step Instructions

1.  **Open Telegram**: Search for the user **@BotFather** (it has a blue verified checkmark).
2.  **Start Chat**: Click "Start" or type `/start`.
3.  **Create Bot**: Type `/newbot`.
4.  **Name It**:
    *   **Name**: `Foresynth Intelligence` (Display name)
    *   **Username**: `Foresynth_Bot` (Must be unique and end in `bot`).
5.  **Get Token**: BotFather will reply with an **HTTP API Token**.
    *   *Example*: `123456789:ABCdefGHIjklMNOpqrsTUVwxYz`
    *   **Copy this token**. We will need it for the `.env` file.

### Required Environment Variables
Once you have the token, we will update your `.env` files:

**Backend (`apps/api/.env`)**:
```bash
TELEGRAM_BOT_TOKEN="<your_token_here>"
TELEGRAM_WEBHOOK_SECRET="<random_string_for_security>"
```

---

## Implementation Roadmap

1.  **Stop Development**: Do not build features on top of shaky ground.
2.  **Setup Auth**: Implement Supabase Auth (Frontend + Backend).
3.  **Database Migration**: Add `profiles` table with `telegram_chat_id`.
4.  **Bot Backend**: Implement the Telegram Webhook receiver in FastAPI.
5.  **Frontend Connect**: Add the "Connect Telegram" button and redirection logic.
