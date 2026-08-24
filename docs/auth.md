# Authentication

The site is hosted on **Azure Static Web Apps** and protected by a shared
passcode for the private trial. The passcode is verified server-side; it is not
embedded in the browser bundle or repository.

## How it works

1. **Page guard** — protected pages load `site/gate-guard.js` before rendering.
   Outside localhost, it calls `GET /api/check` and redirects an unauthenticated
   visitor to `/gate.html` while preserving the intended URL.
2. **Sign-in** — `site/gate.html` sends the supplied passcode to
   `POST /api/gate`. The Function compares it with the `SITE_PASSCODE` app
   setting using a timing-safe comparison.
3. **Session** — a successful check sets the `ase_gate` cookie. The cookie is
   `HttpOnly`, `Secure`, `SameSite=Lax`, valid for seven days, and contains only
   an expiry plus an HMAC made with `GATE_SECRET`.
4. **Content protection** — lesson documents, quizzes, Python entry points, and
   lesson assets are not deployed below the public `site/` tree. The workflow
   stages them below `api/content/_data/`, and `GET /api/content` returns them
   only after validating the same signed cookie.

The page guard improves the user experience, but `api/content` is the actual
access-control boundary for curriculum files. Removing or bypassing the browser
script does not grant access to protected lesson content.

## Local development

`gate-guard.js` bypasses the check only on `localhost` and `127.0.0.1`, because a
plain static file server cannot run the Azure Functions. Production hostnames do
not receive this bypass. Use the repository's local server when the full
Function-backed gate needs to be exercised.

## Azure settings

The Static Web App must define both values below:

- `SITE_PASSCODE` — the shared trial passcode.
- `GATE_SECRET` — a strong random secret used only to sign session cookies.

Neither value belongs in source control, generated site data, client-side
JavaScript, logs, or screenshots. Rotating `GATE_SECRET` immediately invalidates
all active sessions. Rotating `SITE_PASSCODE` prevents new sessions from using
the old passcode but does not invalidate already signed cookies; rotate both when
immediate revocation is required.

## Deployment invariants

- `.github/workflows/azure-static-web-apps.yml` deploys `site/` as the public web
  root and `api/` as the managed Function app.
- Lesson content must never be copied into `site/phases/` or another public
  static path.
- Every protected HTML entry point must load `/gate-guard.js` before its visible
  content.
- `/api/check`, `/api/gate`, and `/api/content` must continue to use the shared
  cookie validation in `api/lib/gate-auth.js`.

The custom-domain verification and rollback procedure lives in
`docs/runbook-domain-cutover.md`.
