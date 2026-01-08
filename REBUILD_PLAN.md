# Rebuild Plan: Solana Yield Chat (Routing + UI Immutability)

This document describes how to rebuild the Solana “yield chat” experience so it is:

- Consistent and personalized
- Robust to ambiguous follow-ups (e.g., “try again”, “out of these”, “all pools”)
- Immune to regressions where previously rendered results change (no shrinking cards, no surprise skeletons)
- Safe from tool-call loops and “agent-less” text-only answers when the user expects cards

## 1) Problem Summary (What’s Broken)

### 1.1 Tool-call loops and repeated yields outputs
Symptoms:
- Repeated “Fetched … lending yields” tool cards appearing multiple times
- The system “keeps going” even after the user got the answer

Root causes (typical):
- Forcing a tool call without a per-turn guard (model keeps re-triggering)
- Over-broad “force yields tool” heuristics that match too often
- Lack of an explicit “stop condition” (the model isn’t told when the goal is done)

### 1.2 Previously answered content mutates
Symptoms:
- A message that showed many pools later “shrinks” to 3 cards
- Skeletons reappear in old messages during a new user query

Root causes (typical):
- UI rendering depends on global chat state (`isLoading`, `messages`) instead of the tool result for that message
- Components re-compute “show all / show top 3” based on the latest user text, not the request that produced the card

### 1.3 Text-only answers where “cards” are expected
Symptoms:
- “Which pool has the highest TVL?” gets a bullet list, not a yields card UI
- Output looks like it didn’t go through an agent/tool path

Root causes (typical):
- Routing chooses a general “explore” response path that doesn’t require tool calls
- No router contract that enforces “cards-first” for pool-selection questions

### 1.4 Poor follow-up handling (“try again”, “out of these”, “all pools”)
Symptoms:
- “Try again” becomes a no-op (blank response or wrong route)
- “Out of these…” doesn’t reliably use the current context

Root causes (typical):
- No stable representation of “current context” (last yield results, last selected pool, last cancelled action)
- Over-reliance on heuristics instead of a single routing decision with explicit memory inputs

## 2) Non-Negotiable UX Invariants

These must always hold:

1) **Transcript immutability**
- Once a message renders N cards, it must never change to M cards later.
- No new skeletons/placeholder UI should appear inside an already-rendered message.

2) **Card-first for pool questions**
- Questions like “which pool…”, “highest TVL”, “highest APY”, “all pools”, “out of these” must yield cards (tool UI), not bullet lists.

3) **No “surprise” text headings**
- Never show headings like “Lend USDC” or “USDS” unless the UI is explicitly presenting a structured header.

4) **No tool-call loops**
- A single user message must have a bounded number of tool calls.
- A forced tool choice must have a strict stop condition.

5) **Personalization only when needed**
- Read-only browsing should not trigger wallet checks.
- Execution flows can require wallet tools, but only when the user is executing.

## 3) Architecture Rebuild (LLM-Led Router + Guardrails)

### 3.1 Replace heuristic routing with a router contract
Create a single, small “Router” LLM step that outputs *only* JSON:

```json
{
  "agent": "lending|staking|wallet|knowledge|recommendation",
  "mode": "explore|execute",
  "ui": "cards|cards_then_text|text",
  "toolPlan": [
    { "tool": "solana_lending_yields", "args": { "sortBy": "apy", "limit": 50 } }
  ],
  "stopCondition": "when_first_yields_result_received"
}
```

Benefits:
- One place to reason about “what to do next”
- Easy to test (fixtures)
- Easy to guard (max tool calls, loop prevention)

### 3.2 Deterministic guardrails around the router
Keep routing “smart” but safe:

- **Loop guard**: refuse repeating the same tool call with the same args within a single user turn.
- **Budget**: strict max tool calls per turn (e.g., 1–2 in explore, 3–5 in execute).
- **Tool gating by mode**:
  - Explore: yields/read-only tools only
  - Execute: wallet + balance + execution tools
- **Stop condition enforcement**:
  - “cards” queries stop immediately after the yields tool result is returned

### 3.3 Add minimal memory inputs (context) to the router
The router should receive:

- Last yield domain (`lending|staking`)
- Last yields tool args (`sortBy`, `limit`, `symbol`, `project`)
- Last yields tool result ids (or a short summary)
- Last cancelled/failed action (`lend|stake|withdraw`)
- Last selected pool (token mint, protocol)

This enables “try again” and “out of these” to work reliably without fragile text parsing.

## 4) UI Rebuild (Message-Scoped Rendering)

### 4.1 Message-scoped state only
Tool UI components must only use:
- The tool invocation args
- The tool result body
- Local state that is frozen on mount for that message

They must NOT depend on:
- Global `isLoading`
- The latest chat `messages`

### 4.2 Freeze “show all” / “limit” decisions at render time
For yields:
- The number of displayed pools is determined by the tool args (e.g., `limit: 50`)
- Not by re-reading the latest user message

### 4.3 Consistent layout ordering
Default order:
1) Tool card(s)
2) Assistant text (short, non-duplicative)

Exceptions:
- Optional: a very short lead-in (“Here are the pools…”) above the card, but never long text above tools.

## 5) Product Behaviors (Concrete Rules)

### 5.1 “All pools”
- Must call yields tool with `limit: 50`
- Default `sortBy: apy` unless user explicitly asked TVL/safety

### 5.2 “Highest TVL”
- Must call yields tool with `sortBy: tvl`
- Use cards; summarize the top TVL pool in 1–2 lines below the cards

### 5.3 “Highest yield/APY”
- Must call yields tool with `sortBy: apy`
- Use cards; summarize the top APY pool in 1–2 lines below the cards

### 5.4 “Try again”
- Resume the most recent cancelled/failed *action* (lend/stake/withdraw) using stored context
- Never becomes text-only

## 6) Implementation Phases

### Phase 0 — Emergency Stabilization (same day)
- Add a kill-switch feature flag for “forced yields tool” behavior.
- Add a hard loop guard: same-tool+same-args cannot execute twice in the same user turn.
- Add routing logs (agent/mode/toolPlan) to make loops debuggable.

Success criteria:
- No repeated yields cards from one message.

### Phase 1 — Router Contract + Tests (1–2 days)
- Implement Router JSON contract (model step).
- Integrate deterministic guardrails.
- Add routing fixtures for:
  - “give me all pools”
  - “out of these, highest TVL”
  - “which has highest yield”
  - “try again”

Success criteria:
- 100% deterministic routing decisions in fixtures.

### Phase 2 — UI Immutability (1–2 days)
- Remove global-state dependencies from tool UIs.
- Ensure prior messages never change when new messages stream.

Success criteria:
- A transcript immutability test passes: old yields message never changes pool count/order.

### Phase 3 — Personalization (optional, 2–4 days)
- Add wallet-aware decisions only when user asks “for my wallet/portfolio”.
- Add “resume execution” flow with stored pool + token info.

Success criteria:
- “Try again” and “resume” flows work without re-fetching unrelated yields.

## 7) Verification Checklist

- [ ] No loops in tool calls
- [ ] “All pools” always shows many cards (limit=50)
- [ ] “Highest TVL” sorts by TVL, not APY
- [ ] “Highest yield” sorts by APY, not TVL
- [ ] No “Lend USDC” headings in text output
- [ ] Tool cards render before long text (knowledge tools included)
- [ ] Old messages never change during new message streaming

## 8) Immediate Next Action

Start with **Phase 0** (kill-switch + loop guard + logging), then implement the Router JSON contract + tests before touching more UI behavior.

