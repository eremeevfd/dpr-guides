# dpr-guides CORS proxy

A tiny Cloudflare Worker that proxies `users.roblox.com` for the Roblox
Username Lookup tool, since that Roblox API has no CORS headers of its own.

Unlike public proxies (allorigins.win, corsproxy.io), this is dedicated to
this site: it only forwards to an allowlisted set of Roblox hosts, and only
proxies requests carrying an Origin header from `dpr-guides.fyi` /
`eremeevfd.github.io` (rejecting everything else with 403), so it isn't
shared with (or rate-limited by) other sites' traffic. Origin can be spoofed
by a determined non-browser caller, but this stops casual scripted reuse of
the free-tier quota.

Deployed at `https://dpr-guides-cors-proxy.cors-proxy-worker.workers.dev`,
already wired into `assets/script.js`'s `CORS_PROXIES` list as the primary
proxy, with `allorigins.win` kept as a fallback.

## Deploy / redeploy

```
cd cors-proxy-worker
npx wrangler login      # one-time browser auth with your Cloudflare account
npx wrangler deploy
```

Free tier covers 100k requests/day, which is far more than this tool needs.

## Local dev

```
npx wrangler dev
```
