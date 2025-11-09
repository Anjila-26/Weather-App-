# Weather App

## Quick Start

**Geolocation doesn't work with `file://` URLs!**

Instead of double-clicking the HTML file, run a local server:

```bash
# Option 1: Python (simplest)
python3 -m http.server 8000

# Option 2: Node.js (if you have it)
npx http-server -p 8000
```

Then open: **http://localhost:8000/popup.html**

## Why?

Modern browsers block geolocation on `file://` URLs for security. You need either:
- `http://localhost` (local server)
- `https://` (deployed site)

That's why it stopped working - you probably opened it as a file instead of through a server!
