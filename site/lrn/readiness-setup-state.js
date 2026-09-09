/* Explicit onboarding confirmation. Assessment and role data stay in their
   existing stores; this record only remembers that the learner reviewed them. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LrnReadinessSetupState = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  var KEY = "aifs:readiness-setup:v1";
  function validRole(role) { return typeof role === "string" && /^[a-z][a-z0-9-]{0,39}$/.test(role); }
  function create(storage) {
    var memory = null;
    var localOnly = false;
    function read() {
      if (localOnly) return memory;
      try {
        var value = JSON.parse(storage.getItem(KEY));
        return value && value.version === 1 && validRole(value.roleId) && Number.isFinite(value.completedAt) ? value : null;
      } catch (_) { return memory; }
    }
    return {
      isComplete: function (role) { var value = read(); return validRole(role) && !!value && value.roleId === role; },
      complete: function (role) {
        if (!validRole(role)) return false;
        memory = { version: 1, roleId: role, completedAt: Date.now() };
        try { storage.setItem(KEY, JSON.stringify(memory)); localOnly = false; return true; }
        catch (_) { localOnly = true; return false; }
      }
    };
  }
  return { create: create, key: KEY };
});
