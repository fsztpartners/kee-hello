import { defineTool } from "eve/tools";
import { z } from "zod";

// The one tool. A pure, deterministic text transform: greet + uppercase.
//
// No tenant, no database, no network — the whole point is to be the smallest
// thing that still proves the agent runs end-to-end. The required Hunter.io
// connection (declared in entry.json) gates INSTALL at the platform layer; it is
// intentionally NOT used here, so the agent stays trivially readable while still
// exercising the marketplace dependency round-trip.
export default defineTool({
  description:
    "Greets and shouts the given text: prepends a greeting and returns it UPPERCASED. Use this for any 'say hello', 'shout', or 'greet' style request.",
  inputSchema: z.object({
    text: z.string().min(1).max(280).describe("The text to greet and shout."),
    name: z.string().max(80).optional().describe("Who to greet, if named."),
  }),
  execute: async (input) => {
    const greeting = input.name ? `Hello, ${input.name}!` : "Hello!";
    const shouted = `${greeting} ${input.text}`.toUpperCase();
    return { shouted, length: shouted.length };
  },
});
