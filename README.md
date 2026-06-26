# kee-hello

The smallest useful [eve](https://github.com/vercel-labs/eve) agent, packaged as a
**keemakr Marketplace** entry. It does one thing: take some text and **greet +
shout** it back in capitals.

It exists to be the minimal end-to-end example of a Marketplace entry — small
enough to read in a minute. It declares **zero dependencies**, so installing it for
a tenant goes straight to `installed` with nothing to connect first.

## How to use

This agent is a **keemakr Marketplace entry**. You don't run it directly — you **install it for your tenant** from the keemakr Marketplace, then talk to it through the keemakr operator chat.

**1. Install it.** Find **Kee Hello** in the Marketplace and install it. Installing **Kee Hello** for a tenant goes straight to `installed` — it declares no dependencies, so there's nothing to connect first.

**2. Route to it with `@hello`.** Once installed, the **Hello** department is available in the operator chat. Mention it by its handle — **`@hello`** — to route a request to its agents:

| Agent key | Name | What it does |
| --- | --- | --- |
| `shouter` | Shouter | Greets and shouts text via the shout tool. No connections, no database, no subagents. |

**3. Ask it.** For example:

> @hello shout "ship it on fridays"

You'll get back an uppercased shout.

> Connecting external services or sending on your behalf always happens through the tenant connections you authorize at install — the agent reaches them via keemakr's capability proxy and never sees your raw credentials.

## What's here

| Path | What it is |
| --- | --- |
| `agent/agent.ts` | The single eve root agent (cheap model; just calls `shout`). |
| `agent/instructions.md` | How the agent behaves — greet/shout only, nothing else. |
| `agent/tools/shout.ts` | The one tool: a pure `text → "HELLO! …"` transform. |
| `agent/channels/eve.ts` | The HTTP entrypoint (dev-login / OIDC). Root-only in eve. |
| `agent/sandbox.ts` | Pinned to `just-bash` — no real shell, no network. |
| `entry.json` | The Marketplace submission (the `EntrySubmission` the platform ingests). |

## The Marketplace entry

`entry.json` is the metadata the keemakr platform's `registerEntry()` reads. It
declares:

- a **department** `hello` with one **agent** `shouter`,
- **no dependencies** (`dependencies: []`).

Because there are no required connections, this is an instant-install entry: when a
tenant installs it, the platform resolves dependencies (there are none) and flips it
straight to **`installed`** — the department + agent are seeded and enabled
immediately, no `pending_deps` step. The `shout` transform runs entirely in-process:
no tenant, no database, no network.

To exercise the install gate instead, add a required `connection` dependency to
`dependencies` in `entry.json`.

## Develop

```bash
nvm use            # Node >= 24
npm install
npm run dev:eve    # run the eve agent locally
npm run typecheck  # tsc --noEmit
npm run lint
```

Ask it: *"shout 'ship it' for Sam"* → `HELLO, SAM! SHIP IT`.

## Capability grant (tenant identity from keemakr)

When the keemakr operator delegates to this agent, it attaches a short-lived
**capability grant** — a signed JWT carrying the verified tenant id and the scopes
the install was granted. This repo verifies that grant against keemakr-core's
published JWKS in [`agent/channels/eve.ts`](agent/channels/eve.ts) via the
`grantAuth()` helper from [`@keemakr/agent-sdk`](https://www.npmjs.com/package/@keemakr/agent-sdk)
(`import { grantAuth } from "@keemakr/agent-sdk"`), which surfaces the tenant +
scopes on the session auth context.

The grant is the **only** cross-deployment auth — the legacy shared-secret bearer
was retired. Locally, `localDev()` accepts loopback calls and `vercelOidc()` handles
Vercel deployment-to-deployment trust in production.

Configure it with environment variables on the deployed agent:

| Variable | Purpose |
| --- | --- |
| `KEE_CORE_JWKS_URL` | keemakr-core's JWKS endpoint, e.g. `https://app.keemakr.com/.well-known/jwks.json`. If unset, the grant path is off and only dev-login / OIDC apply. |
| `KEE_AGENT_AUDIENCE` | This deployment's audience — its public origin — matching the `aud` the operator mints. |
