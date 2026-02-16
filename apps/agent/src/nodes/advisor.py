"""
Foresynth Agent - Advisor Node

The "synthesizer" — the LLM-powered brain that takes all gathered context
(market snapshots, smart money trades, news) and produces actionable
trading decisions with transparent reasoning paths.

This is the most critical node in the graph.
"""
import json
import logging
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from src.state import AgentState, Decision
from src.core.config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are FORESYNTH ADVISOR — an elite AI trading analyst specializing in Polymarket prediction markets.

Your role is to analyze market data, smart-money activity, and news context to produce HIGH-CONFIDENCE trade recommendations with transparent reasoning.

## Your Analytical Framework

1. **Market Efficiency Analysis**: Is the current price (probability) accurate given available information?
2. **Smart Money Signal**: Are tracked whales buying/selling? Follow institutional flow.
3. **News Catalyst**: Is there breaking news that the market hasn't priced in yet?
4. **Risk Assessment**: What could go wrong? What's the downside?

## Risk Profile Context
The user's risk profile is: {risk_profile}
- "conservative" → Only recommend HIGH confidence (>0.8) signals with clear catalysts
- "moderate" → Recommend moderate-to-high confidence signals
- "degen" → Include speculative plays with interesting risk/reward

## Output Format
You MUST respond with valid JSON containing a list of decisions. Each decision must have:
- "market_question": The market question
- "market_slug": The market slug for linking
- "signal": One of "BUY_YES", "BUY_NO", "HOLD", "SKIP"
- "confidence": float 0.0 to 1.0
- "reasoning": A 2-4 sentence explanation of WHY — the decision path
- "key_factors": list of 2-4 bullet points driving the decision
- "risk_level": "low", "medium", or "high"

Only include markets where you have a meaningful opinion. Skip markets with insufficient data.
Respond ONLY with the JSON array, no markdown formatting.
"""


async def advisor_node(state: AgentState) -> dict:
    """
    Synthesize all gathered data into actionable trading decisions.

    Reads: market_snapshots, smart_money_trades, news_items, user_config
    Writes: decisions, messages
    """
    snapshots = state.get("market_snapshots", [])
    trades = state.get("smart_money_trades", [])
    news = state.get("news_items", [])
    config = state.get("user_config", {})
    risk_profile = config.get("risk_profile", "moderate")

    if not snapshots:
        return {
            "decisions": [],
            "messages": ["🧠 Advisor: No markets to analyze."],
        }

    logger.info(f"🧠 Advisor: Synthesizing {len(snapshots)} markets with {len(trades)} trades and {len(news)} news items...")

    # ── Build the analysis prompt ──────────────────────────────
    context_parts = []

    # Market data
    context_parts.append("## MARKET DATA")
    for s in snapshots:
        context_parts.append(
            f"- {s['question']}\n"
            f"  Slug: {s.get('slug', 'N/A')}\n"
            f"  YES: {s['outcome_yes_price']:.1%} | NO: {s['outcome_no_price']:.1%}"
        )

    # Smart money
    if trades:
        context_parts.append("\n## SMART MONEY ACTIVITY (Tracked Wallets)")
        for t in trades[:15]:  # Limit to avoid token overflow
            context_parts.append(
                f"- Wallet {t['wallet'][:6]}...{t['wallet'][-4:]}: "
                f"{t['side']} ${t['usd_size']:,.2f} "
                f"({t['shares']:,.0f} shares @ {t['price']:.3f}) "
                f"on {t['market_slug']}"
            )

    # News / research
    if news:
        context_parts.append("\n## NEWS & RESEARCH")
        for n in news[:10]:
            context_parts.append(
                f"- [{n.get('relevance', 'medium').upper()}] {n['title']}\n"
                f"  Source: {n.get('source', 'web')} | {n.get('snippet', '')[:200]}"
            )

    analysis_prompt = "\n".join(context_parts)

    # ── Call the LLM ───────────────────────────────────────────
    settings = get_settings()
    llm = ChatOpenAI(
        model="openai/gpt-4o-mini",
        temperature=0.3,
        api_key=settings.openai_api_key,
        base_url=settings.openai_api_base,
    )

    system_msg = SystemMessage(content=SYSTEM_PROMPT.format(risk_profile=risk_profile))
    human_msg = HumanMessage(content=f"Analyze the following data and produce trade recommendations:\n\n{analysis_prompt}")

    try:
        response = await llm.ainvoke([system_msg, human_msg])
        raw = response.content.strip()

        # Parse JSON response
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]  # Remove first line
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

        decisions_raw = json.loads(raw)

        # Validate and type each decision
        decisions: list[Decision] = []
        for d in decisions_raw:
            decision: Decision = {
                "market_question": d.get("market_question", ""),
                "market_slug": d.get("market_slug", ""),
                "signal": d.get("signal", "HOLD"),
                "confidence": min(1.0, max(0.0, float(d.get("confidence", 0.5)))),
                "reasoning": d.get("reasoning", ""),
                "key_factors": d.get("key_factors", []),
                "risk_level": d.get("risk_level", "medium"),
            }
            decisions.append(decision)

        msg = f"🧠 Advisor complete: {len(decisions)} recommendations generated"
        logger.info(msg)

        return {
            "decisions": decisions,
            "messages": [msg],
        }

    except json.JSONDecodeError as e:
        logger.error(f"Advisor LLM response was not valid JSON: {e}")
        return {
            "decisions": [],
            "messages": [f"⚠️ Advisor: Failed to parse LLM response — {e}"],
        }
    except Exception as e:
        logger.error(f"Advisor node error: {e}")
        return {
            "decisions": [],
            "messages": [f"❌ Advisor error: {e}"],
        }
