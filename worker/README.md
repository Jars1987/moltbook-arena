# Moltbook API Proxy Worker

Cloudflare Worker that proxies requests to the Moltbook API with authentication.

## Why This Exists

The Moltbook API requires authentication to return author information. This worker:
- Adds your API key to requests securely (server-side)
- Enables CORS for browser requests
- Keeps your API key private (not exposed to frontend)

## Prerequisites

1. **Cloudflare Account** (free tier works fine)
   - Sign up at https://cloudflare.com

2. **Moltbook API Key**
   - Contact Moltbook to obtain an API key
   - Store it securely - never commit it to git

3. **Wrangler CLI**
   - Install: `npm install -g wrangler`
   - Login: `wrangler login`

## Setup

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Set Your API Key

**Option A: Using Wrangler (Recommended)**
```bash
wrangler secret put MOLTBOOK_API_KEY
# Enter your API key when prompted
```

**Option B: Using Cloudflare Dashboard**
1. Go to Workers & Pages
2. Select your worker
3. Settings → Variables → Add variable
4. Name: `MOLTBOOK_API_KEY`
5. Type: Secret
6. Value: Your API key

### 3. Test Locally

```bash
npm run dev
```

This starts the worker at `http://localhost:8787`

Test it:
```bash
curl http://localhost:8787/posts?limit=10
```

### 4. Deploy to Cloudflare

```bash
npm run deploy
```

You'll get a URL like: `https://moltbook-arena-proxy.YOUR-SUBDOMAIN.workers.dev`

## Update Frontend

After deploying, update `src/config.ts`:

```typescript
export const GAME_CONFIG = {
  // ... other config ...
  API: {
    // For local development
    // BASE_URL: 'http://localhost:8787',

    // For production (replace with your worker URL)
    BASE_URL: 'https://moltbook-arena-proxy.YOUR-SUBDOMAIN.workers.dev'
  }
};
```

Then update `src/services/moltbook.ts`:

```typescript
private baseUrl = GAME_CONFIG.API.BASE_URL;
```

## Endpoints

The worker proxies all Moltbook API v1 endpoints:

- `GET /posts?limit=50` → Returns posts with author data
- `GET /posts/:id/comments` → Returns comments with author data
- All other Moltbook API endpoints work the same way

## Security Notes

✅ **API key is server-side only** - Never exposed to browser
✅ **CORS enabled** - Works from any origin (you can restrict this if needed)
✅ **Secrets stored securely** - Cloudflare encrypts environment variables

## Troubleshooting

### "Module not found" error
Make sure you're in the `worker` directory: `cd worker`

### API returns 401 Unauthorized
Your API key might be invalid or not set. Check:
```bash
wrangler secret list
```

### CORS errors
The worker includes CORS headers. If you still see errors, check that you're using the worker URL, not the direct Moltbook API.

## Cost

Cloudflare Workers free tier includes:
- 100,000 requests per day
- More than enough for this game!

## Development

To modify the worker:
1. Edit `src/index.js`
2. Test locally: `npm run dev`
3. Deploy: `npm run deploy`
