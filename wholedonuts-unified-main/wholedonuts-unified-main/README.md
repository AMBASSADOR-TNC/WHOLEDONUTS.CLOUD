# wholedonuts-unified

Unified repository for the WholeDonuts system and related components.

## Launch path

This repository now has a single static entry point:

- `/index.html` (loads `/src/main.js`)

## Run locally

No build step is required.

From the repository root, run any static server, for example:

```bash
python -m http.server 8080
```

Then open:

- `http://localhost:8080/`

## Deploy path

This scaffold is ready for static hosting (including GitHub Pages).

- Default Pages URL (project site): `https://thewholedonuts-beep.github.io/wholedonuts-unified/`
- Custom domain target example: `https://wenevergonnaclose.com`

For GitHub Pages custom domain usage, keep the root `CNAME` file in place and set DNS records at your registrar to point to GitHub Pages.
