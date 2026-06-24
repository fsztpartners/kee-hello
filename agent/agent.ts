import { defineAgent } from "eve";
import { anthropic } from "@ai-sdk/anthropic";

// kee-hello — the smallest useful eve agent.
//
// eve allows exactly ONE root agent per project (agent/agent.ts). This is it:
// a single agent with one tool (`shout`) that performs a tiny text transform —
// greet + uppercase the text it's given. There are no departments, no subagents,
// no database. It exists to be the minimal, end-to-end keemakr Marketplace entry:
// something small enough to read in a minute that still exercises the full
// register → resolve-dependencies → install round-trip (it declares one required
// connection, Hunter.io — see entry.json).
//
// Model routing mirrors the platform convention: the Vercel AI Gateway string in
// production (needs AI_GATEWAY_API_KEY), the direct Anthropic provider in local
// dev. The model just decides to call `shout` and relays the result, so it's the
// cheap tier.
export default defineAgent({
  model: process.env.AI_GATEWAY_API_KEY
    ? "anthropic/claude-haiku-4.5"
    : anthropic("claude-haiku-4-5-20251001"),
});
