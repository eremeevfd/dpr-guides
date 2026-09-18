# dpr-guides CORS proxy

A tiny Cloudflare Worker that proxies `users.roblox.com` for the Roblox
Username Lookup tool, since that Roblox API has no CORS headers of its own.

Unlike public proxies (allorigins.win, corsproxy.io), this is dedicated to
this site: it only forwards to an allowlisted set of Roblox hosts, only sets
CORS headers for `dpr-guides.fyi` / `eremeevfd.github.io`, and isn't shared
with (or rate-limited by) other sites' traffic.

## Deploy

```
cd cors-proxy-worker
npx wrangler login      # one-time browser auth with your Cloudflare account
npx wrangler deploy
```

This prints the worker's `*.workers.dev` URL. Put that in
`assets/script.js`'s `CORS_PROXIES` list, e.g.:

```js
function (url) { return "https://dpr-guides-cors-proxy.<your-subdomain>.workers.dev/?url=" + encodeURIComponent(url); }
```

Free tier covers 100k requests/day, which is far more than this tool needs.

## Local dev

```
npx wrangler dev
```
