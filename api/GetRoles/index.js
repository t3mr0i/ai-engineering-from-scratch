/**
 * Static Web Apps custom roles function.
 *
 * SWA calls this after a successful Entra login (rolesSource in
 * staticwebapp.config.json). It receives the authenticated principal and
 * returns the roles to grant. We grant the `lhind` role ONLY when the user's
 * email belongs to an allowed corporate domain.
 *
 * This is the real, server-side access control — it cannot be bypassed from the
 * browser (unlike the old client-side gate.js password prompt). Login itself is
 * still open to any Microsoft account, but without the `lhind` role every
 * content route returns 401/403 (see allowedRoles in staticwebapp.config.json).
 *
 * Interim policy: allow the whole *.dlh.de domain (covers lhind.dlh.de, dlh.de,
 * etc.). Later, switch to a single-tenant App Registration (openIdIssuer ->
 * https://login.microsoftonline.com/<lhind-tenant-id>/v2.0) and the domain
 * check below becomes redundant.
 */

// Allowed email domains. We match on the part after the `@` so that both the
// bare domain (someone@dlh.de) and any subdomain (kai@lhind.dlh.de) are covered,
// while spoofs like evil@notdlh.de.attacker.com are rejected.
const ALLOWED_DOMAINS = ['dlh.de'];

function domainAllowed(email) {
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1);
  return ALLOWED_DOMAINS.some(
    (d) => domain === d || domain.endsWith('.' + d)
  );
}

module.exports = async function (context, req) {
  const claims = (req.body && req.body.claims) || [];

  // Entra surfaces the email under different claim types depending on the token;
  // check the common ones plus userDetails as a fallback.
  const emailClaimTypes = [
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    'emails',
    'email',
    'preferred_username',
    'upn',
  ];

  let email = '';
  for (const c of claims) {
    if (c && emailClaimTypes.includes(c.typ) && c.val) {
      email = c.val;
      break;
    }
  }
  if (!email && req.body && req.body.userDetails) {
    email = req.body.userDetails;
  }

  email = String(email).trim().toLowerCase();

  const allowed = domainAllowed(email);

  context.res = {
    body: { roles: allowed ? ['lhind'] : [] },
  };
};
