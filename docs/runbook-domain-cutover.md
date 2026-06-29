# Runbook — Custom-Domain Cutover from SWA to App Service

**Status:** ready, but **not executed** by automation. DNS changes are global
and affect every learner — the platform / network team must drive this.

**Context.** The LHIND AI learning catalog moved from an Azure Static Web App
(`swa-ase-webpage`, URL `yellow-mushroom-…azurestaticapps.net`) to a gated App
Service (`ase-site-gated`, URL `ase-site-gated.azurewebsites.net`). The SWA URL
is SWA-specific and **not portable** — moving the public hostname requires a
real custom domain (e.g. `learn.lhind.de`). Until that domain points at the
App Service, the old SWA URL still serves the old, ungated content.

## Why this is split from the deploy

- DNS records at the LHIND registrar cannot be set by the app repo.
- App Service Custom Domain binding + managed TLS certificate need either
  Contributor on the App Service (granted) **and** the platform team's
  blessing on the certificate issuer (Microsoft-managed vs. customer-uploaded).
- Existing cookies remain valid after the cutover as long as `GATE_SECRET`
  is unchanged on the new host (it is — same value as the SWA).
- Retiring the SWA is only safe once the domain has propagated **and** any
  existing cookies have expired (TTL 7 days). Otherwise users with old links
  land on a broken SWA.

## Prerequisites

- [ ] Custom domain decided and owned by LHIND (e.g. `learn.lhind.de`,
      possibly with a subdomain like `ai.lhind.de`).
- [ ] Platform team has access to the DNS zone for that domain.
- [ ] Platform team can issue / bind a TLS certificate (App Service managed
      cert is the default — free, auto-renewed, works for apex and subdomains).
- [ ] No learners are mid-session without a 7-day cookie window (or warn them).

## Steps (platform team)

### 1. Verify the App Service is healthy and gated

```bash
B=https://ase-site-gated.azurewebsites.net
# gate.html reachable without cookie
curl -I $B/gate.html                                        # expect 200
# everything else gated
curl -I $B/data.js                                          # expect 401
curl -I -H 'Accept: text/html' $B/                         # expect 302 to gate.html
# passcode + cookie flow works
curl -s -c /tmp/c.txt -X POST -H 'Content-Type: application/json' \
  -d '{"passcode":"<the real SITE_PASSCODE>"}' $B/api/gate
curl -I -b /tmp/c.txt $B/data.js                            # expect 200
```

### 2. Add the custom domain to the App Service

```bash
DOMAIN="learn.lhind.de"        # adjust
APP="ase-site-gated"
RG="rg-ase-webpage"

# Bind the domain (managed cert is created automatically on first HTTPS).
az webapp config hostname add --hostname "$DOMAIN" \
  --webapp-name "$APP" --resource-group "$RG"

# Wait for the managed certificate to provision, then enable TLS-only.
az webapp config ssl create --hostname "$DOMAIN" \
  --name "$APP" --resource-group "$RG" --key-vault-parameters ""
az webapp update --https-only true -n "$APP" -g "$RG"
```

Verify with `az webapp config hostname list --webapp-name $APP -g $RG` —
both the `*.azurewebsites.net` default and `$DOMAIN` should appear, and the
new domain should reach a `Ready` state.

### 3. Cut DNS over to the App Service

For an **apex domain** (`learn.lhind.de`), use an **A record** pointing at
the App Service IP:

```bash
IP=$(az webapp show -n "$APP" -g "$RG" --query "hostNameSslStates[?hostName=='$APP.azurewebsites.net'].ipAddress" -o tsv | head -1)
echo "A record: $IP"
```

For a **subdomain** (`ai.lhind.de`), use a **CNAME** to `ase-site-gated.azurewebsites.net`.

DNS TTL on the old SWA's records: if a CNAME points at `*.azurestaticapps.net`,
set its TTL down to 300 s before cutover and lower the new record's TTL too.
This shrinks the window where some resolvers still see the old target.

### 4. Wait for propagation + verify

```bash
dig +short $DOMAIN             # should resolve to the App Service IP / CNAME
dig +short -t CNAME ai.lhind.de  # for subdomains
curl -I -H 'Accept: text/html' "https://$DOMAIN/"  # expect 302 to gate.html
```

### 5. Retire the SWA — only after **both** conditions hold

- [ ] DNS for the custom domain resolves to the App Service everywhere.
- [ ] More than **7 days** have passed since the last cookie was minted on the
      old SWA (so every existing `ase_gate` cookie is past its TTL).

```bash
RG="rg-ase-webpage"
SWA="swa-ase-webpage"

# Stop first (reversible). Then delete once confident.
az staticwebapp stop -n "$SWA" -g "$RG"          # pause, reversible
az staticwebapp delete -n "$SWA" -g "$RG" --yes  # irreversible
```

After deletion, also drop the related app settings and the deployment token
in the GitLab CI/CD variables.

## Cookie behaviour across the cutover

`GATE_SECRET` is the same on SWA and App Service, so a cookie minted on the
old SWA validates on the new App Service and vice versa. Users with an active
session keep their session across the cutover without re-entering the
passcode.

`SITE_PASSCODE` is also unchanged. Anyone with the old cookie is still good.

## What can go wrong

- **TLS certificate not ready** when DNS cuts over → visitors see a cert
  error. Fix: wait. App Service managed certs take ~15 minutes after
  hostname binding.
- **Stale cookies after SWA retirement** — only an issue if a user hasn't
  visited in >7 days. They'll re-enter the passcode; no other impact.
- **Old SWA URL leaks in bookmarks** — the SWA returns 404 once deleted.
  Announce the new URL to learners; old bookmarks degrade gracefully.
- **DNS CNAME to `*.azurestaticapps.net` lingers** — remove it once
  propagation has finished. Otherwise the apex domain still resolves to
  Microsoft's SWA front door and could mask a takeover.

## Verification matrix after cutover

| Probe | Expected |
|---|---|
| `curl -I https://<domain>/` (HTML nav) | `302 → https://<domain>/gate.html?r=%2F` |
| `curl -I https://<domain>/data.js` | `401` |
| `POST` correct passcode to `/api/gate` | `200`, `Set-Cookie: ase_gate=…; Secure; HttpOnly; SameSite=Lax; Max-Age=604800` |
| With cookie, `GET /data.js` | `200`, `Content-Type: text/javascript`, ~752 KB |
| Forged cookie | `401` |
| Old `yellow-mushroom-…azurestaticapps.net` URL | `404` (SWA deleted) |

## Owner / sign-off

Domain registrar access, DNS zone edits, and App Service custom-domain
binding are all platform-team actions. The application team (this repo)
owns the server code, the deploy pipeline, and the secrets. Hand off this
runbook to the platform team with the SSH-free expectation that they only
need section 1 ("verify") to confirm health, then section 3 to drive DNS.

After cutover, remove the `/api/gate` + `/api/check` legacy function code
from the repo (they live on the SWA's managed functions, which go away with
the SWA) and prune `docs/api.md` references to them.