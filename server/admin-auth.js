/**
 * Resolves curriculum-admin identities from trusted reverse-proxy headers.
 * Production roles come from ADMIN_ROLES_JSON; an explicit ADMIN_DEV_MODE
 * enables a local development identity without creating a password store.
 */

const ROLE_ORDER = ["editor", "reviewer", "publisher"];

function parseRoleConfig(raw) {
  if (!raw) return { users: {}, groups: {} };
  try {
    const value = JSON.parse(raw);
    return {
      users: value && typeof value.users === "object" ? value.users : {},
      groups: value && typeof value.groups === "object" ? value.groups : {},
    };
  } catch (error) {
    throw new Error(`ADMIN_ROLES_JSON is invalid JSON: ${error.message}`);
  }
}

function normalizeRoles(values) {
  const requested = new Set(Array.isArray(values) ? values : [values]);
  const highest = ROLE_ORDER.reduce(
    (found, role, index) => requested.has(role) ? Math.max(found, index) : found,
    -1,
  );
  if (highest < 0) return [];
  return ROLE_ORDER.slice(0, highest + 1);
}

function header(req, name) {
  const value = req.headers[String(name || "").toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function resolveAdmin(req, env = process.env) {
  const devMode = env.ADMIN_DEV_MODE === "true";
  const identityHeader = env.ADMIN_IDENTITY_HEADER || "x-forwarded-user";
  const groupsHeader = env.ADMIN_GROUPS_HEADER || "x-forwarded-groups";
  let username = header(req, identityHeader);
  let groups = String(header(req, groupsHeader) || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!username && devMode) {
    username = header(req, "x-admin-dev-user") || "local-admin";
    groups = ["local-admins"];
  }
  if (!username) return null;

  const config = parseRoleConfig(env.ADMIN_ROLES_JSON);
  const requested = [
    ...(config.users[username] || []),
    ...groups.flatMap((group) => config.groups[group] || []),
  ];
  if (devMode && username === "local-admin" && requested.length === 0) {
    requested.push("publisher");
  }
  const roles = normalizeRoles(requested);
  if (roles.length === 0) return null;
  return { username, groups, roles, isDevelopment: devMode };
}

function can(actor, role) {
  return Boolean(actor && actor.roles && actor.roles.includes(role));
}

module.exports = { ROLE_ORDER, parseRoleConfig, normalizeRoles, resolveAdmin, can };
