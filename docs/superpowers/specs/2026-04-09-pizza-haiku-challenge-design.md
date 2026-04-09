# Pizza Haiku Challenge — Design Spec

## Overview

A mobile-friendly web app for a career night event where students scan a QR code and compete in a prompt engineering challenge. The goal: get Claude to write a haiku about pizza — without using the word "pizza" in your prompt. Leaderboard ranks by fewest words used.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Deployment:** Vercel
- **AI:** Claude Sonnet via Anthropic SDK (`@anthropic-ai/sdk`)
- **QR Code:** `qrcode` npm package (server-side generation)
- **Styling:** CSS Modules or Tailwind — fun/colorful theme (pizza-inspired warm gradients, emojis)
- **State:** In-memory array on the server (no database, acceptable for single-evening event)

## Pages

### `GET /` — Challenge Page
- Mobile-first layout
- Fun header: pizza emojis, playful gradient (oranges/yellows/reds), title "Pizza Haiku Challenge"
- Subtitle explaining rules: "Get the AI to write a haiku about pizza — without using the word pizza in your prompt. Fewest words wins!"
- Name input (persisted in localStorage so returning visitors skip it)
- Prompt textarea with live word counter
- Submit button (disabled during loading, shows spinner)
- Result area: styled card showing generated haiku + success/fail message
- On success: "You did it in X words! Check the leaderboard!"
- On fail: "Nice haiku, but it's not about pizza! Try again."
- Persistent link to `/leaderboard`

### `GET /leaderboard` — Leaderboard Page
- Same branding/theme as main page
- Ranked table: position, name, word count, winning haiku
- Top 3: gold/silver/bronze styling with pizza emoji trophies
- Auto-refreshes every 10 seconds (for projector display)
- Back link to challenge page

### `GET /qr` — QR Code Display Page
- Large centered QR code pointing to `NEXT_PUBLIC_SITE_URL`
- Dark background for high contrast / easy scanning
- URL displayed as text below the QR code for manual entry
- Designed for showing on a laptop screen or projector

## API Routes

### `POST /api/submit`
**Request body:**
```json
{
  "name": "string",
  "prompt": "string"
}
```

**Server-side logic:**
1. Validate `name` (non-empty, max 30 chars) and `prompt` (non-empty, max 200 chars)
2. Check prompt does not contain "pizza" or variants (case-insensitive: pizza, pizzas, p1zza, p!zza, etc.)
3. Count words: `prompt.trim().split(/\s+/).length`
4. Call Claude Sonnet — system: "Write a haiku based on the user's prompt." / user: the prompt
5. Call Claude Sonnet — system: "You are a judge. Does the following haiku describe pizza? Reply ONLY with JSON: {\"isPizza\": boolean}" / user: the haiku
6. Parse judge response as JSON
7. If `isPizza === true`: add/update leaderboard entry (keep best score per name)
8. Return response

**Response body:**
```json
{
  "haiku": "string",
  "isPizza": true,
  "wordCount": 8,
  "leaderboardRank": 3
}
```

### `GET /api/leaderboard`
Returns the leaderboard array sorted by word count ascending, ties broken by earliest timestamp.

```json
{
  "entries": [
    { "name": "Alex", "wordCount": 5, "haiku": "...", "rank": 1 },
    ...
  ]
}
```

## In-Memory Store

```typescript
interface LeaderboardEntry {
  name: string;
  wordCount: number;
  prompt: string;
  haiku: string;
  timestamp: number;
}

// Global array, sorted by wordCount ASC, then timestamp ASC
let leaderboard: LeaderboardEntry[] = [];
```

- Only keeps each player's best (lowest word count) score
- No persistence — resets on cold start (acceptable for event)

## Validation Rules

- Prompt must not contain "pizza" (case-insensitive regex: `/p[i1!]zz[a@]/i`)
- Prompt max length: 200 characters
- Prompt min length: 1 character
- Name max length: 30 characters
- Client-side validation mirrors server-side (server is authoritative)

## Environment Variables

- `ANTHROPIC_API_KEY` — Claude API key (server-side only)
- `NEXT_PUBLIC_SITE_URL` — deployed URL for QR code generation (e.g., `https://pizza-haiku.vercel.app`)

## QR Code

Generated server-side using the `qrcode` npm package, rendered as an inline SVG or data URL on the `/qr` page. Points to `NEXT_PUBLIC_SITE_URL`.

## UI Theme

- **Colors:** Warm gradient background (orange → red → yellow), white/dark text for contrast
- **Typography:** Playful, rounded font (system fonts with fun fallbacks, or a Google Font like Fredoka)
- **Emojis:** Pizza slices, trophies, fire emojis used as decorative elements
- **Mobile-first:** All layouts work on phone screens, large tap targets
- **Leaderboard:** Top 3 highlighted with gold/silver/bronze backgrounds
