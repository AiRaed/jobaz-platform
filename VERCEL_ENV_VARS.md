# Vercel Environment Variables

## Required for Production

### Authentication & Core
- `NEXT_PUBLIC_SUPABASE_URL` (Public - Safe)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Public - Safe)
- `NEXT_PUBLIC_APP_URL` (Public - Safe) - Production domain URL (e.g., `https://your-app.vercel.app`)

## Optional (Feature-Specific)

### AI Features
- `OPENAI_API_KEY` (Server-only)
- `OPENAI_MODEL` (optional, default `gpt-4o-mini`)
- `OPENAI_MODEL_QUALITY` (optional, default `gpt-4o` for complex routes)

### Text-to-Speech
- `ELEVENLABS_API_KEY` (Server-only)
- `ELEVENLABS_VOICE_ID` (Server-only, optional - has default)

### Job Search APIs
- `REED_API_KEY` (Server-only)
- `REED_API_BASE` (Server-only, optional - default: `https://www.reed.co.uk/api/1.0`)
- `ADZUNA_APP_ID` (Server-only)
- `ADZUNA_APP_KEY` (Server-only)
- `ADZUNA_API_BASE` (Server-only, optional - default: `https://api.adzuna.com/v1/api`)

### Payments
- `STRIPE_SECRET_KEY` (Server-only)
- `STRIPE_PRICE_ID` (Server-only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Public - Safe)

### Storage & Caching
- `SUPABASE_SERVICE_ROLE_KEY` (Server-only)
- `TTS_BUCKET_NAME` (Server-only, optional - default: `tts-cache`)

---

**Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public keys/URLs)
- Server-only variables must be kept secret
- App has graceful fallbacks when optional features are missing
