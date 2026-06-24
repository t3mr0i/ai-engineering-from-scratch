# Authentication

The site is hosted on **Azure Static Web Apps** and protected by **Microsoft Entra ID**
(Azure AD). This replaces the old client-side `gate.js` password prompt, which was
not real access control.

## How it works

1. **Login** — any unauthenticated request to a content route is redirected to the
   Entra login (`/.auth/login/aad`). This is configured in
   `site/staticwebapp.config.json` (`auth.identityProviders.azureActiveDirectory`).
2. **Domain restriction** — login itself is open to any Microsoft account, but every
   content route requires the **`lhind` role**. The role is granted server-side by
   the `api/GetRoles` function, which inspects the authenticated user's email and
   only returns `lhind` when the address ends in **`.dlh.de`** (covers `lhind.dlh.de`,
   `dlh.de`, …). Users without the role get a 403 (`site/403.html`).

Because the role check runs in the managed Function, it **cannot be bypassed from the
browser** — unlike the old password gate.

## Azure setup (already provisioned)

The following is configured on the live resources and does not need to be redone:

- **SWA**: `swa-ase-webpage` (rg `rg-ase-webpage`), **Standard** plan.
- **App Registration**: `ai-training-swa-auth`
  (client id `3d49822f-cf03-4e69-a488-7996a8072075`), **single tenant**
  (`AzureADMyOrg`) in the LHIND tenant `d9f5cb22-01c9-4956-b859-4f876f6a5c83`.
  Redirect URI: `https://yellow-mushroom-0c0a45d03.7.azurestaticapps.net/.auth/login/aad/callback`,
  id-token issuance enabled.
- **SWA app settings**: `AAD_CLIENT_ID`, `AAD_CLIENT_SECRET` are set.
- `staticwebapp.config.json` `openIdIssuer` points at the LHIND tenant (not `common`),
  so **only LHIND-tenant identities can obtain a token at all**.

This means there are now **two** layers: the single-tenant issuer (Entra-level
"LHIND only") and the `.dlh.de` check in `GetRoles` (defence in depth). The domain
check can be relaxed or removed later if the tenant boundary is considered enough.

## Maintenance

- The **client secret expires after 1 year**. Rotate with:
  `az ad app credential reset --id 3d49822f-cf03-4e69-a488-7996a8072075 --years 1`
  then update the `AAD_CLIENT_SECRET` SWA app setting with the new value.
- The CI deploys the `api/` folder via `--api-location ./api`.
