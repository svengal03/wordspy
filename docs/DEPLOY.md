# 🚀 Wordspy — Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (sign up free at vercel.com with GitHub)
- Pusher account (sign up free at pusher.com)

---

## Step 1 — Get Your Pusher Credentials

1. Go to [pusher.com](https://pusher.com) and sign in
2. Click **Create App**
3. Name it "Wordspy", choose your cluster (e.g. `mt1`), select **Channels**
4. Go to the **App Keys** tab
5. Copy: **app_id**, **key**, **secret**, **cluster**

---

## Step 2 — Push to GitHub

```bash
# In the wordspy folder
git init
git add .
git commit -m "Initial commit — Wordspy India Edition"

# Create a new repo on github.com, then:
git remote add origin https://github.com/yourusername/wordspy.git
git push -u origin main
```

---

## Step 3 — Deploy to Vercel

### Option A — Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select your `wordspy` repo
3. Framework: **Next.js** (auto-detected)
4. Environment Variables — add all four:
   ```
   NEXT_PUBLIC_PUSHER_KEY     = your_pusher_key
   NEXT_PUBLIC_PUSHER_CLUSTER = mt1
   PUSHER_APP_ID              = your_pusher_app_id
   PUSHER_SECRET              = your_pusher_secret
   ```
5. Click **Deploy**
6. Wait ~2 minutes → your app is live!

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel

# When prompted, add all four env vars above
```

---

## Step 4 — Test Your Deployment

1. Open your Vercel URL (e.g. `wordspy.vercel.app`)
2. Enter a name → Create Room
3. Copy the room code
4. Open a new browser tab → Join with code
5. Host should see the new player appear in the lobby
6. Start a game and test end-to-end

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PUSHER_KEY` | ✅ Yes | Pusher app key (public, safe to expose) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ✅ Yes | Pusher cluster region (e.g. `mt1`) |
| `PUSHER_APP_ID` | ✅ Yes | Pusher app ID (server-side only) |
| `PUSHER_SECRET` | ✅ Yes | Pusher secret (server-side only, never expose) |
| `NEXT_PUBLIC_APP_URL` | Optional | Your deployed URL (for sharing links) |
| `ANTHROPIC_API_KEY` | 🚧 Future | Claude AI word generator (not yet implemented) |

---

## Custom Domain (Optional)

1. In Vercel dashboard → your project → **Settings** → **Domains**
2. Add your domain (e.g. `wordspy.in` or `playwordspy.com`)
3. Follow DNS instructions
4. SSL is automatic ✅

---

## Pusher Free Tier Limits

| Metric | Free Limit | Wordspy Usage |
|---|---|---|
| Concurrent connections | 100 | ~10 players per room × N rooms |
| Messages per day | 800,000 | ~1000 messages per game |
| Channels | Unlimited | 1 per room |

**Estimate:** Free tier supports roughly 200–300 complete game sessions per day. More than enough to start!

---

## Monitoring

- **Vercel Dashboard** → Functions tab → see API route invocations and errors
- **Pusher Dashboard** → Stats tab → see message counts, connections
- **Vercel Analytics** → enable free analytics in project settings

---

## Troubleshooting

### "Room not found" error
- Check all four `PUSHER_*` env vars are set correctly in Vercel environment variables
- Vercel serverless functions are stateless — the in-memory room store resets on cold starts
- **Fix:** For production reliability, add Redis (see upgrade guide)

### Players not seeing real-time updates
- Check browser console for Pusher connection errors
- Verify `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` match your app's values
- Try the Pusher dashboard → Debug Console → check for events being received

### Cold start delay
- First request after inactivity may be slow (Vercel wakes up the function)
- Normal for free tier — subsequent requests are fast
- **Fix:** Add a ping cron job, or upgrade Vercel plan

---

## Upgrade: Add Redis for Persistent Room State

When you're ready to scale, replace in-memory storage with Redis:

1. Sign up at [upstash.com](https://upstash.com) (free tier: 10,000 requests/day)
2. Create a Redis database
3. Add env var: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Install: `npm install @upstash/redis`
5. Replace the `rooms` Map in `app/api/rooms/route.ts` with Redis calls

This makes room state persist across serverless function instances and cold starts.

---

## Upgrade: Claude AI Word Generator

When you want infinite fresh word pairs:

1. Add `ANTHROPIC_API_KEY` to Vercel env vars
2. Create `app/api/generate-words/route.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  const { theme } = await req.json();
  const client = new Anthropic();
  
  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Generate 5 word pairs for an Undercover party game with theme: "${theme}". 
      Each pair should be two closely related but different words/phrases.
      Format as JSON: [{"civilian": "word1", "undercover": "word2"}]
      Only return the JSON array, nothing else.`
    }]
  });
  
  const pairs = JSON.parse(msg.content[0].text);
  return Response.json({ pairs });
}
```

3. Add a "Generate with AI" button in the LobbySetup component
