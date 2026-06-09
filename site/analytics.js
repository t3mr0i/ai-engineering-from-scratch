/**
 * Azure Application Insights (web) — shared across all pages.
 *
 * Replaces the former Vercel Analytics tracker after the move to Azure
 * Static Web Apps. Paste the connection string from the Application Insights
 * resource (Overview → Connection String). Until it is set this file is a
 * no-op, so pages stay clean with no failed network calls.
 *
 * The connection string is an ingestion-scoped key, safe to ship in client
 * markup; kept here so it has a single source of truth.
 *
 * This is a plain multi-page site (every nav is a full page load), so the
 * SDK's own init-time trackPageView is exactly one view per page — no SPA
 * route tracking and no manual trackPageView needed.
 */
(function () {
  // TODO(LHIND): paste the Application Insights connection string here.
  var CONNECTION_STRING = '';
  if (!CONNECTION_STRING) return;

  var s = document.createElement('script');
  s.src = 'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.onload = function () {
    var AI = window.Microsoft && window.Microsoft.ApplicationInsights;
    if (!AI) return;
    var appInsights = new AI.ApplicationInsights({
      config: { connectionString: CONNECTION_STRING },
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();
    window.appInsights = appInsights;
  };
  document.head.appendChild(s);
})();
