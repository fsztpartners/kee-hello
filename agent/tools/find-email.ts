// find-email — the Hunter find-email tool from @keemakr/tools.
//
// This is the whole integration: one line. The tool body lives in the published
// package and runs on the @keemakr/agent-sdk floor, so kee-hello never touches
// the tenant's Hunter credential — it calls keemakr-core's capability proxy, and
// the key stays in core. The tool name is `find-email` (from this file's path).
export { findEmail as default } from "@keemakr/tools/hunter";
