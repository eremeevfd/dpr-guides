// Minimal CORS proxy for the DPR Guides Roblox Username Lookup tool.
// Only forwards GET requests to a small allowlist of Roblox API hosts, and
// only proxies requests carrying an Origin header from the site's own
// origin(s) - this is intentionally NOT a general-purpose open proxy.
// (Origin can be spoofed by a determined non-browser caller, but this
// stops casual scripted reuse of the free-tier quota.)

const ALLOWED_TARGET_HOSTS = new Set([
  "users.roblox.com",
]);

const ALLOWED_ORIGINS = new Set([
  "https://dpr-guides.fyi",
  "https://eremeevfd.github.io",
]);

function corsHeaders(origin) {
  const headers = { "Vary": "Origin" };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
  headers["Access-Control-Allow-Headers"] = "Content-Type";
  return headers;
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url");
    if (!target) {
      return new Response(JSON.stringify({ error: "Missing url param" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid url param" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (targetUrl.protocol !== "https:" || !ALLOWED_TARGET_HOSTS.has(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: "Target host not allowed" }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    try {
      const upstream = await fetch(targetUrl.toString(), {
        headers: { "Accept": "application/json" },
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { ...headers, "Content-Type": upstream.headers.get("Content-Type") || "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
  },
};
