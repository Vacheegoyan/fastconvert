# YouTube Video Converter

Next.js app for converting YouTube videos to MP3/MP4 and downloading thumbnails. Built for Node 20 LTS and production deployment with Nginx + PM2.

## Local development

- **Node:** Use Node 20 LTS (see [nodejs.org](https://nodejs.org/)).

```bash
# Install dependencies
npm install

# Copy env example and set values
cp .env.example .env

# Run dev server (default http://localhost:3000)
npm run dev
```

## Production build

```bash
# Install dependencies
npm ci

# Set production env vars (see Environment variables)
# Then build and start
npm run build
npm run start
```

- **Build:** `npm run build` — runs `next build`.
- **Start:** `npm run start` — runs `next start -p 3000` (listens on port 3000).
- **Lint:** `npm run lint` — runs `eslint .`.

## Environment variables

Create a `.env` from `.env.example` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Yes (production) | Public site URL with no trailing slash. Used for canonical URLs, sitemap, and Open Graph. Example: `https://yourdomain.com`. Local dev: `http://localhost:3000`. |
| `ADMIN_PASSWORD` | Yes (production) | Password for `/admin`. Change from default in production. |

- Do **not** commit `.env` or any file containing secrets (see `.gitignore`).
- For production on a VPS, set these in the environment or in a `.env` file that is not in the repo.

## How URL lookup and search work

- **URL preview (paste a YouTube link):** When you paste a YouTube URL, the app calls `POST /api/download` with `action: 'preview'`. The server runs the **Python** script `yt.py` (via **yt-dlp**) to fetch video metadata (title, thumbnail, duration). So the server must have **Python** and **yt-dlp** installed.
- **Text search (Search modal):** The Search button calls `POST /api/search`, which uses the Node package **yt-search** to query YouTube. Results can be empty or fail if the server IP is rate-limited or blocked by YouTube.

## Deploying on Vercel (limitations)

- **Vercel serverless runs only Node.js.** It does **not** run Python or allow spawning `yt.py`. So on a domain hosted on Vercel:
  - **URL preview** (and download/prepare) will **not** work: the API returns an error (e.g. "Unable to load video information"). You will see this message in the UI and in the browser console after the latest changes.
  - **Search** may return no results if YouTube blocks or limits Vercel’s IPs.
- For full functionality (preview + convert + search), deploy on a **VPS** (e.g. Ubuntu + Nginx + PM2) where you can install Python and yt-dlp, as in the section below.

## Deployment (Ubuntu VPS, Nginx + PM2)

1. Clone the repo and set env vars on the server. Install **Python 3** and **yt-dlp** (required for URL preview and conversion).
2. Install Node 20, then: `npm ci && npm run build`.
3. Run with PM2: `pm2 start npm --name "yt-converter" -- start` (or use an `ecosystem.config.js`).
4. Point Nginx to `http://127.0.0.1:3000` as upstream and proxy to it.
5. Restart: `pm2 restart yt-converter`.

## License

Private. Use responsibly; comply with applicable laws and platform terms.
