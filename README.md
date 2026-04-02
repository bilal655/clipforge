# ClipForge 🎬

AI-powered VOD clipping for streamers. Upload a stream, get short-form clips with captions — ready to post.

---

## What it does

1. You upload a stream VOD (MP4, MOV, up to 10GB)
2. OpenAI Whisper transcribes the audio
3. Claude AI reads the transcript and picks the best highlight moments
4. FFmpeg cuts the clips and burns in captions (bold, outline, or highlight style)
5. Clips are ready to download and post to TikTok, Instagram, YouTube Shorts

---

## Before you start — what you need

You need accounts on two services (both have free tiers to start):

### 1. Anthropic API key (for Claude AI)
- Go to: https://console.anthropic.com
- Sign up → go to "API Keys" → create a new key
- Copy it — looks like: `sk-ant-api03-...`
- Cost: ~$0.003 per highlight detection run (very cheap)

### 2. OpenAI API key (for Whisper transcription)
- Go to: https://platform.openai.com/api-keys
- Sign up → "Create new secret key"
- Copy it — looks like: `sk-proj-...`
- Cost: ~$0.006 per minute of audio transcribed

### 3. FFmpeg installed on your computer/server
FFmpeg is free software that cuts and processes the videos.

**Mac:**
```bash
brew install ffmpeg
```

**Ubuntu/Linux (for server deployment):**
```bash
sudo apt update && sudo apt install ffmpeg -y
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH.

---

## Running locally (on your own computer)

### Step 1 — Install Node.js
Download from https://nodejs.org (choose the LTS version)

### Step 2 — Download this project
```bash
git clone <your-repo-url>
cd clipforge
```

Or just unzip the folder if you downloaded it as a ZIP.

### Step 3 — Install dependencies
```bash
npm install
```

### Step 4 — Set up your API keys
Copy the example env file:
```bash
cp .env.example .env.local
```

Open `.env.local` in any text editor and fill in your keys:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
```

### Step 5 — Run the app
```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

That's it — ClipForge is running! 🎉

---

## Deploying online (so clients can use it)

The cheapest and easiest way: **Vercel (frontend) + Railway (backend/FFmpeg)**

### Option A — Railway (recommended, handles everything)

Railway runs your full Next.js app including FFmpeg processing.

1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub and select this repo
4. In Railway dashboard, go to "Variables" and add:
   ```
   ANTHROPIC_API_KEY=your-key
   OPENAI_API_KEY=your-key
   ```
5. Railway auto-detects Next.js and deploys it
6. Your app gets a URL like `clipforge.up.railway.app`

**Cost:** ~$5-20/month depending on usage. Free tier available.

**Important:** Add FFmpeg to Railway by creating a `nixpacks.toml` file in your project root:
```toml
[phases.setup]
nixPkgs = ["ffmpeg"]
```

### Option B — Vercel + separate video processing

Vercel is great for the frontend but has a 50MB function limit — too small for video processing. For now, use Railway which handles the full stack.

---

## Adding a custom domain

Once deployed on Railway:
1. Go to your Railway project → Settings → Domains
2. Add your custom domain (e.g. `app.clipforge.io`)
3. Update your DNS records as instructed

---

## Pricing your service

Suggested tiers to charge clients:

| Plan | Price | Clips/month | Sell to |
|------|-------|-------------|---------|
| Starter | $29/mo | 30 clips | Hobbyist streamers |
| Pro | $79/mo | 100 clips | Full-time streamers |
| Agency | $199/mo | Unlimited | Multi-streamer agencies |

Your cost per clip is roughly $0.05-0.15 depending on VOD length. At $29/mo for 30 clips you're charging ~$1/clip with 85%+ margin.

---

## Adding Stripe payments (to collect money)

1. Sign up at https://stripe.com
2. Install Stripe: `npm install stripe @stripe/stripe-js`
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
4. Message me and I'll build the payment pages for you.

---

## File structure

```
clipforge/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts      ← Handles file uploads
│   │   │   ├── clips/route.ts       ← Job status polling
│   │   │   └── download/route.ts    ← Serves finished clips
│   │   ├── dashboard/page.tsx       ← Main UI
│   │   └── layout.tsx
│   ├── components/
│   │   └── JobTracker.tsx           ← Live progress tracker
│   └── lib/
│       ├── types.ts                 ← TypeScript types
│       ├── jobStore.ts              ← In-memory job storage
│       ├── transcribe.ts            ← Whisper API integration
│       ├── highlights.ts            ← Claude AI highlight detection
│       ├── ffmpeg.ts                ← Video cutting + captions
│       └── pipeline.ts              ← Orchestrates the full flow
├── .env.example                     ← Copy this to .env.local
├── package.json
└── README.md                        ← This file
```

---

## Common issues

**"FFmpeg not found"**
→ FFmpeg isn't installed or not in your PATH. Run `ffmpeg -version` to check.

**"OpenAI API error"**
→ Check your API key is correct in `.env.local`. Make sure you have credits.

**"File too large"**
→ For local development, Next.js has a default body limit. For large files (>500MB), you'll want to set up direct-to-S3 uploads. Message me for help.

**Clips have no audio**
→ Make sure the source video has an audio track. Some screen recordings don't.

---

## Roadmap (v2)

- [ ] Direct TikTok posting via API
- [ ] Direct Instagram Reels posting
- [ ] YouTube Shorts posting
- [ ] Stripe subscription billing
- [ ] User accounts + clip history (Supabase)
- [ ] Twitch VOD URL input (no upload needed)
- [ ] AI-generated captions that sync word-by-word
- [ ] Custom caption fonts and colours
- [ ] Clip analytics dashboard

---

Built with Next.js, Claude API, OpenAI Whisper, and FFmpeg.
