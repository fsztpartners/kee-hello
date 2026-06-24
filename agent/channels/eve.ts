import {
  type AuthFn,
  extractBearerToken,
  localDev,
  vercelOidc,
} from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

// The single HTTP entrypoint. Channels are root-only in eve and therefore live
// here.
//
// This agent is a REMOTE agent: the keemakr operator (a separate deployment)
// delegates to it over HTTP. The receiving side must authorize that caller. We
// accept three callers, walked in order:
//   1. localDev()    — loopback dev calls (eve dev on localhost).
//   2. vercelOidc()  — Vercel deployment-to-deployment trust (prod demo).
//   3. bearerSecret() — a shared-secret bearer token. This is the cross-process
//      path the operator uses when the call is NOT loopback and NOT yet a
//      Vercel-to-Vercel OIDC trust (e.g. operator on `next dev` calling this
//      service on `eve dev`, or a non-Vercel host). The operator attaches the
//      same secret outbound with `bearer(token)` (phase 4).
//
// Set KEE_HELLO_INBOUND_SECRET in the environment to enable the bearer path. If
// it is unset, bearerSecret() skips (returns null) and only localDev/vercelOidc
// apply — so the shared-secret surface only exists when you opt in.
function bearerSecret(): AuthFn<Request> {
  return (request) => {
    const expected = process.env.KEE_HELLO_INBOUND_SECRET;
    if (!expected) return null; // not configured → skip to next entry
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token || token !== expected) return null; // not our caller → skip
    return {
      attributes: { via: "shared-secret" },
      authenticator: "bearer-secret",
      principalId: "keemakr-operator",
      principalType: "service",
    };
  };
}

export default eveChannel({
  auth: [localDev(), vercelOidc(), bearerSecret()],
});
