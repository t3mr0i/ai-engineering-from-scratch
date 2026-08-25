# MCP Security II — OAuth 2.1, Resource Indicators, Incremental Scopes

> Remote MCP servers need authorization, not just authentication. The 2025-11-25 spec aligns with OAuth 2.1 + PKCE + resource indicators (RFC 8707) + protected-resource metadata (RFC 9728). SEP-835 adds incremental scope consent with step-up authorization on 403 WWW-Authenticate. This lesson implements the step-up flow as a state machine so you can see every hop.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security I)
**Time:** ~75 minutes

## Learning Objectives

- Distinguish resource server from authorization server responsibilities.
- Walk the PKCE-protected OAuth 2.1 authorization code flow.
- Use `resource` (RFC 8707) and protected-resource metadata (RFC 9728) to prevent confused-deputy attacks.
- Implement step-up authorization: server responds 403 with WWW-Authenticate asking for a higher scope; client re-prompts user consent and retries.

## The Problem

Early MCP (pre-2025) shipped remote servers with ad-hoc API keys or even no auth. The 2025-11-25 spec closes that gap with a full OAuth 2.1 profile.

Three real-world needs:

- **Ordinary remote servers.** User installs a remote MCP server that accesses their Notion / GitHub / Gmail. OAuth 2.1 with PKCE is the right shape.
- **Scope escalation.** A notes server granted `notes:read` can later need `notes:write` for a specific action. Instead of re-doing the whole flow, step-up (SEP-835) asks for the additional scope.
- **Confused deputy prevention.** Client holds a token audience-scoped for Server A. Server A is malicious and tries to present the token to Server B. Resource indicators (RFC 8707) pin the token to its intended audience.

OAuth 2.1 is not new. What is new is MCP's profile: specific required flows (authorization code + PKCE only; no implicit, no client credentials by default), resource indicators mandatory on every token request, and protected-resource metadata published so clients know where to go.

## The Concept

### Roles

- **Client.** The MCP client (Claude Desktop, Cursor, etc.).
- **Resource server.** The MCP server (notes, GitHub, Postgres, whatever).
- **Authorization server.** Issues tokens. May be the same service as the resource server or a separate IdP (Auth0, Keycloak, Cognito).

In MCP's profile, resource and authorization servers CAN be the same host but SHOULD be distinguished by URLs.

### Authorization code + PKCE

The flow:

1. Client generates `code_verifier` (random) and `code_challenge` (SHA256).
2. Client redirects user to `/authorize?response_type=code&client_id=...&redirect_uri=...&scope=notes:read&code_challenge=...&resource=https://notes.example.com`.
3. User consents. Authorization server redirects to `redirect_uri?code=...`.
4. Client POSTs to `/token?grant_type=authorization_code&code=...&code_verifier=...&resource=...`.
5. Authorization server validates the verifier's hash against the stored challenge and issues an access token.
6. Client uses the token: `Authorization: Bearer ...` on every request to the resource server.

PKCE prevents authorization-code interception attacks. Resource indicators prevent the token from being valid elsewhere.

### Protected-resource metadata (RFC 9728)

The resource server publishes a `.well-known/oauth-protected-resource` document:

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:read", "notes:write", "notes:delete"]
}
```

Client discovers the authorization server from the resource server. Reduces configuration — the client only needs the resource URL.

### Resource indicators (RFC 8707)

`resource` parameter in the token request pins the token's intended audience. The issued token contains `aud: "https://notes.example.com"`. Another MCP server receiving this token checks `aud` and rejects it.

### Scope model

Scopes are space-separated strings. Common MCP conventions:

- `notes:read`, `notes:write`, `notes:delete`
- `admin:*` for admin capabilities (use sparingly)
- `profile:read` for identity

Scope selection should be least-privilege: request what you need now, step up when you need more.

### Step-up authorization (SEP-835)

User grants `notes:read`. They later ask the agent to delete a note. The server responds:

```
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope",
    scope="notes:delete", resource="https://notes.example.com"
```

Client sees the insufficient_scope error, prompts the user with a consent dialog for the additional scope, performs a mini OAuth flow for it, retries the request with the new token.

### Token audience validation

Every request: server checks `token.aud == self.resource_url`. Mismatch = 401. This stops cross-server token reuse.

### Short-lived tokens and rotation

Access tokens SHOULD be short-lived (1 hour default). Refresh tokens rotate on every refresh. The client handles silent refresh in the background.

### No token passthrough

Sampling servers (Phase 13 · 11) MUST NOT pass the client's token through to other services. The sampling request is the boundary.

### Confused deputy prevention

Token binds to `aud`. Client binds to `client_id`. Every request validated against both. The spec explicitly bans the old "pass-the-token" pattern that was common in pre-MCP remote tool ecosystems.

### Client ID discovery

Each MCP client publishes its metadata at a fixed URL. Authorization servers can fetch the client's metadata document to discover redirect URIs and contact info. This removes manual client registration.

### Gateways and OAuth

Phase 13 · 17 shows how an enterprise gateway handles OAuth: gateway holds credentials for upstream servers, tokens to the client are gateway-issued, and upstream tokens never leave the gateway. This flips the trust model — users authenticate with the gateway once; gateway handles N server authorizations.



## Build It

Reconstruct **MCP Security II — OAuth 2.1, Resource Indicators, Incremental Scopes** by following `Token` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `Token` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-oauth-scope-planner.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [MCP — Authorization spec](https://modelcontextprotocol.io/specification/draft/basic/authorization) — canonical MCP OAuth profile
- [den.dev — MCP November authorization spec](https://den.dev/blog/mcp-november-authorization-spec/) — walkthrough of the 2025-11-25 changes
- [RFC 8707 — Resource indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707) — the audience-pinning RFC
- [RFC 9728 — OAuth 2.0 protected resource metadata](https://datatracker.ietf.org/doc/html/rfc9728) — the discovery-document RFC
- [Aembit — MCP OAuth 2.1, PKCE and the future of AI authorization](https://aembit.io/blog/mcp-oauth-2-1-pkce-and-the-future-of-ai-authorization/) — practical step-up-flow walk-through

## Exercises

Work from the smallest fixture that the MCP Security II — OAuth 2.1, Resource Indicators, Incremental Scopes demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `Token`, `AuthorizationServer`, `authorize`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Distinguish resource server from authorization server responsibilities.**.
2. **Perturb one field.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Walk the PKCE-protected OAuth 2.1 authorization code flow.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Use `resource` (RFC 8707) and protected-resource metadata (RFC 9728) to prevent confused-deputy attacks.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-oauth-scope-planner.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Implement step-up authorization: server responds 403 with WWW-Authenticate asking for a higher scope; client re-prompts user consent and retries.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **MCP Security II — OAuth 2.1, Resource Indicators, Incremental Scopes** should contain:

- the `python3 main.py` output for the text "red fox", with `Token`, `AuthorizationServer`, `authorize` traced to the value or shape that supports **Distinguish resource server from authorization server responsibilities.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Walk the PKCE-protected OAuth 2.1 authorization code flow.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Use `resource` (RFC 8707) and protected-resource metadata (RFC 9728) to prevent confused-deputy attacks.**; and
- an updated `outputs/skill-oauth-scope-planner.md` example with a concrete input, expected output field, and acceptance check tied to **Implement step-up authorization: server responds 403 with WWW-Authenticate asking for a higher scope; client re-prompts user consent and retries.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
