# kee-hello

The smallest useful [eve](https://github.com/vercel-labs/eve) agent, packaged as a
**keemakr Marketplace** entry. It does one thing: take some text and **greet +
shout** it back in capitals.

It exists to be the minimal end-to-end example of a Marketplace entry — small
enough to read in a minute, but complete enough to exercise the platform's full
`register → resolve-dependencies → install` round-trip.

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
- one **required connection** dependency: **Hunter.io** (`provider: "hunter"`).

The required connection is what makes this more than a stub: when a tenant installs
the entry, the platform resolves dependencies against that tenant. Until they
connect Hunter.io, the install sits in **`pending_deps`** (department + agent seeded
but disabled); once connected, a reconcile flips it to **`installed`**. The demo
transform itself does **not** call Hunter — it's the smallest real required
dependency, present purely to exercise the install gate.

To make it install immediately instead, set `dependencies` to `[]` in `entry.json`.

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
`grantAuth()` helper in [`agent/lib/grant-auth.ts`](agent/lib/grant-auth.ts), which
surfaces the tenant + scopes on the session auth context.

The grant is **primary** auth, ahead of the legacy shared secret (which now rides
in its own `x-keemakr-secret` header during the migration window).

Configure it with environment variables on the deployed agent:

| Variable | Purpose |
| --- | --- |
| `KEE_CORE_JWKS_URL` | keemakr-core's JWKS endpoint, e.g. `https://app.keemakr.com/.well-known/jwks.json`. If unset, the grant path is off and only dev-login / OIDC / the shared secret apply. |
| `KEE_AGENT_AUDIENCE` | This deployment's audience — its public origin — matching the `aud` the operator mints. |
| `KEE_HELLO_INBOUND_SECRET` | Optional legacy shared secret (fallback only; being retired). |

> The `grant-auth.ts` helper is the same one published as
> [`@keemakr/agent-sdk`](https://www.npmjs.com/package/@keemakr/agent-sdk)
> (`import { grantAuth } from "@keemakr/agent-sdk"`). It is vendored here for now
> and will be replaced by the package import.
