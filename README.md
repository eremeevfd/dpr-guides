# DPR Guides

Fan-made guide site for the Roblox game **+1 Damage Per Revive**: equipment sets, evolutions, and relic mechanics, hosted on GitHub Pages.

Live site: https://eremeevfd.github.io/dpr-guides/

## Structure

- `index.html` — the whole site (single page, anchor-linked sections)
- `assets/styles.css`, `assets/script.js` — styling and the image lightbox
- `assets/*.png` — guide screenshots

## Adding a new guide

1. Drop the screenshot in `assets/` with a descriptive filename.
2. Add a new `<section class="card" id="...">` in `index.html` with a heading, summary bullets, and an `<img>`.
3. Add a matching link in the sidebar `<nav>`.
