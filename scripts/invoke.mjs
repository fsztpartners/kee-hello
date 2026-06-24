// Phase 1 verification + the recorded session request shape (reused by phases 4/5).
//
// Invokes the running kee-hello eve service with "shout 'ship it' for Sam" and
// prints the final assistant message. Uses the eve/client SDK so it handles the
// POST /eve/v1/session create + NDJSON stream loop for us.
//
//   HOST=http://127.0.0.1:2100 \
//   KEE_HELLO_INBOUND_SECRET=... \
//   node scripts/invoke.mjs "shout 'ship it' for Sam"
//
// Auth: if KEE_HELLO_INBOUND_SECRET is set we send it as a bearer token (the
// shared-secret inbound path). On a loopback host localDev() also accepts it, so
// the bearer is what makes this representative of the cross-process operator call.
import { Client } from "eve/client";

const host = process.env.HOST ?? "http://127.0.0.1:2100";
const secret = process.env.KEE_HELLO_INBOUND_SECRET;
const prompt = process.argv[2] ?? "shout 'ship it' for Sam";

const client = new Client({
  host,
  ...(secret ? { auth: { bearer: () => secret } } : {}),
});

const health = await client.health();
console.error(`[health] ${health.status} (${host})`);

const session = client.session();
const response = await session.send(prompt);
console.error(`[session] ${response.sessionId}`);

const result = await response.result();
console.error(`[status] ${result.status}`);

// Did the run actually call the `shout` tool? (Proves it wasn't improvised.)
const toolCalls = result.events
  .filter((e) => e.type === "action.result" || e.type === "tool.result" || e.type?.includes("tool"))
  .map((e) => e.type);
console.error(`[tool events] ${JSON.stringify(toolCalls)}`);

console.log(result.message ?? "(no message)");
