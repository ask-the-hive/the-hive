# Prompt Architecture (Project Standard)

Goals:
- Keep model context small and stable.
- Stop “append-only” prompt drift (duplication, contradictions, stale facts).
- Put deterministic behavior in code (routing, gating, schemas), not prose.

## Layers

1) **Router / classifier prompts**
- Only define the schema fields + a small set of canonical rules/examples.
- No protocol essays or long background.

2) **Agent prompts**
- Only include:
  - scope (what this agent handles vs must not handle)
  - tool calling rules (only where the model must sequence tools)
  - output contracts (structured tools like `ui_decision_response`)
  - safety constraints (no hallucinated tokens/APYs; no raw errors)
- Do not include long factual content (protocol descriptions, market share, etc.).

3) **Tool prompts**
- Describe inputs/outputs and any strict UI-coupled response rules.
- Keep UX copy requirements here (e.g., “0 balance” guidance), not duplicated across agents.

4) **Code enforcement**
- Routing: `classifyIntent()` + `routeIntent()`
- Tool availability: `gateToolsByMode()`
- Decision rendering: `ui_decision_response` schema/tool gating
- Allow-lists: shared utilities (e.g., yield support), not prompt text

## Budgets (targets)

These are targets for ongoing cleanup, not immediate hard failures:
- Classifier system prompt: ~500 tokens
- Agent descriptions: ~800–1200 tokens
- Tool prompts: ~300–800 tokens

Use `yarn audit:prompts` to find offenders.

