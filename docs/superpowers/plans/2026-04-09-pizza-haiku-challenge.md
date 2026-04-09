# Pizza Haiku Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-friendly prompt engineering challenge app where students compete to make Claude write a pizza haiku using the fewest words — deployed to Vercel.

**Architecture:** Next.js App Router with two API routes (`/api/submit`, `/api/leaderboard`), three pages (`/`, `/leaderboard`, `/qr`), and an in-memory leaderboard store. Claude Sonnet generates haikus and judges whether they're about pizza.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, `@anthropic-ai/sdk`, `qrcode` npm package, Vercel deployment.

---

## File Structure

```
c:/career/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.local                    # ANTHROPIC_API_KEY, NEXT_PUBLIC_SITE_URL
├── .gitignore
├── src/
│   ├── lib/
│   │   ├── leaderboard.ts        # In-memory leaderboard store + helpers
│   │   ├── validation.ts         # Prompt/name validation logic
│   │   └── claude.ts             # Claude API calls (generate + judge)
│   ├── app/
│   │   ├── layout.tsx            # Root layout with Fredoka font, global styles
│   │   ├── globals.css           # Tailwind directives + custom gradient classes
│   │   ├── page.tsx              # Main challenge page
│   │   ├── leaderboard/
│   │   │   └── page.tsx          # Leaderboard page
│   │   ├── qr/
│   │   │   └── page.tsx          # QR code display page
│   │   └── api/
│   │       ├── submit/
│   │       │   └── route.ts      # POST /api/submit
│   │       └── leaderboard/
│   │           └── route.ts      # GET /api/leaderboard
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `.gitignore`, `.env.local`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

- [ ] **Step 1: Initialize the Next.js project**

```bash
cd c:/career
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

Select defaults when prompted. This scaffolds the full project structure.

- [ ] **Step 2: Install dependencies**

```bash
npm install @anthropic-ai/sdk qrcode
npm install -D @types/qrcode
```

- [ ] **Step 3: Create `.env.local`**

Create `c:/career/.env.local`:

```
ANTHROPIC_API_KEY=your-api-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 4: Add `.env.local` to `.gitignore`**

Verify `.env.local` is already in `.gitignore` (create-next-app includes it). If not, add it.

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000, shows default Next.js page.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

### Task 2: Validation Module

**Files:**
- Create: `src/lib/validation.ts`

- [ ] **Step 1: Create the validation module**

Create `src/lib/validation.ts`:

```typescript
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const PIZZA_REGEX = /p[i1!]zz[a@]/i;

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: "Name is required" };
  if (trimmed.length > 30) return { valid: false, error: "Name must be 30 characters or less" };
  return { valid: true };
}

export function validatePrompt(prompt: string): ValidationResult {
  const trimmed = prompt.trim();
  if (!trimmed) return { valid: false, error: "Prompt is required" };
  if (trimmed.length > 200) return { valid: false, error: "Prompt must be 200 characters or less" };
  if (PIZZA_REGEX.test(trimmed)) return { valid: false, error: "Prompt cannot contain the word 'pizza' or variants!" };
  return { valid: true };
}

export function countWords(prompt: string): number {
  return prompt.trim().split(/\s+/).length;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validation.ts
git commit -m "feat: add prompt and name validation module"
```

---

### Task 3: Leaderboard Store

**Files:**
- Create: `src/lib/leaderboard.ts`

- [ ] **Step 1: Create the in-memory leaderboard store**

Create `src/lib/leaderboard.ts`:

```typescript
export interface LeaderboardEntry {
  name: string;
  wordCount: number;
  prompt: string;
  haiku: string;
  timestamp: number;
}

// In-memory store — resets on cold start
const entries: Map<string, LeaderboardEntry> = new Map();

export function addEntry(entry: LeaderboardEntry): void {
  const key = entry.name.toLowerCase();
  const existing = entries.get(key);
  // Only keep best (lowest word count) score per player
  if (!existing || entry.wordCount < existing.wordCount) {
    entries.set(key, entry);
  }
}

export function getLeaderboard(): (LeaderboardEntry & { rank: number })[] {
  return Array.from(entries.values())
    .sort((a, b) => a.wordCount - b.wordCount || a.timestamp - b.timestamp)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export function getRank(name: string): number | null {
  const board = getLeaderboard();
  const entry = board.find((e) => e.name.toLowerCase() === name.toLowerCase());
  return entry ? entry.rank : null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/leaderboard.ts
git commit -m "feat: add in-memory leaderboard store"
```

---

### Task 4: Claude API Module

**Files:**
- Create: `src/lib/claude.ts`

- [ ] **Step 1: Create the Claude API module**

Create `src/lib/claude.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateHaiku(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    system: "Write a haiku based on the user's prompt. Reply with ONLY the haiku, nothing else. No title, no explanation.",
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type === "text") return block.text.trim();
  throw new Error("Unexpected response from Claude");
}

export async function judgeHaiku(haiku: string): Promise<boolean> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 50,
    system:
      'You are a judge. Does the following haiku describe pizza (the food)? Consider references to ingredients, preparation, eating, or characteristics of pizza. Reply ONLY with JSON: {"isPizza": true} or {"isPizza": false}',
    messages: [{ role: "user", content: haiku }],
  });

  const block = response.content[0];
  if (block.type === "text") {
    const parsed = JSON.parse(block.text.trim());
    return parsed.isPizza === true;
  }
  throw new Error("Unexpected response from Claude");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/claude.ts
git commit -m "feat: add Claude API module for haiku generation and judging"
```

---

### Task 5: API Routes

**Files:**
- Create: `src/app/api/submit/route.ts`, `src/app/api/leaderboard/route.ts`

- [ ] **Step 1: Create the submit API route**

Create `src/app/api/submit/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateName, validatePrompt, countWords } from "@/lib/validation";
import { generateHaiku, judgeHaiku } from "@/lib/claude";
import { addEntry, getRank } from "@/lib/leaderboard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, prompt } = body;

    const nameCheck = validateName(name ?? "");
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    const promptCheck = validatePrompt(prompt ?? "");
    if (!promptCheck.valid) {
      return NextResponse.json({ error: promptCheck.error }, { status: 400 });
    }

    const trimmedName = (name as string).trim();
    const trimmedPrompt = (prompt as string).trim();
    const wordCount = countWords(trimmedPrompt);

    const haiku = await generateHaiku(trimmedPrompt);
    const isPizza = await judgeHaiku(haiku);

    if (isPizza) {
      addEntry({
        name: trimmedName,
        wordCount,
        prompt: trimmedPrompt,
        haiku,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      haiku,
      isPizza,
      wordCount,
      leaderboardRank: isPizza ? getRank(trimmedName) : null,
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Something went wrong. Try again!" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the leaderboard API route**

Create `src/app/api/leaderboard/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = getLeaderboard();
  return NextResponse.json({ entries });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/
git commit -m "feat: add submit and leaderboard API routes"
```

---

### Task 6: Global Layout & Styles

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update the root layout**

Replace the contents of `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "Pizza Haiku Challenge",
  description: "Can you make the AI write a haiku about pizza without saying pizza?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={fredoka.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Update globals.css**

Replace the contents of `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b35, #ff4444, #ffaa00);
  color: #1a1a1a;
}

.card {
  @apply bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6;
}

.btn-primary {
  @apply bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl
         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
         active:scale-95 text-lg;
}

.haiku-card {
  @apply bg-yellow-50 border-2 border-orange-300 rounded-2xl p-6 text-center
         italic text-lg leading-relaxed;
}

.gold { background: linear-gradient(135deg, #ffd700, #ffec80); }
.silver { background: linear-gradient(135deg, #c0c0c0, #e8e8e8); }
.bronze { background: linear-gradient(135deg, #cd7f32, #e8a862); }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add global layout with Fredoka font and pizza theme styles"
```

---

### Task 7: Challenge Page (Main Page)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build the challenge page**

Replace the contents of `src/app/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { validateName, validatePrompt, countWords } from "@/lib/validation";

interface SubmitResult {
  haiku: string;
  isPizza: boolean;
  wordCount: number;
  leaderboardRank: number | null;
}

export default function ChallengePage() {
  const [name, setName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("pizza-haiku-name");
    if (saved) {
      setName(saved);
      setNameSubmitted(true);
    }
  }, []);

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validateName(name);
    if (!check.valid) {
      setError(check.error!);
      return;
    }
    localStorage.setItem("pizza-haiku-name", name.trim());
    setName(name.trim());
    setNameSubmitted(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validatePrompt(prompt);
    if (!check.valid) {
      setError(check.error!);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong!");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Try again!");
    } finally {
      setLoading(false);
    }
  }

  function handleChangeName() {
    localStorage.removeItem("pizza-haiku-name");
    setNameSubmitted(false);
    setResult(null);
  }

  const wordCount = prompt.trim() ? countWords(prompt) : 0;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          🍕 Pizza Haiku Challenge 🍕
        </h1>
        <p className="text-white/90 mt-3 text-lg max-w-md mx-auto">
          Get the AI to write a haiku about pizza — without using the word
          &quot;pizza&quot; in your prompt. Fewest words wins!
        </p>
      </div>

      <div className="card w-full max-w-md">
        {!nameSubmitted ? (
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <label className="block text-lg font-semibold">What&apos;s your name?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={30}
              className="w-full border-2 border-orange-300 rounded-xl px-4 py-3 text-lg
                         focus:outline-none focus:border-orange-500"
            />
            <button type="submit" className="btn-primary w-full">
              Let&apos;s Go! 🚀
            </button>
          </form>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-lg">Playing as: {name}</span>
              <button onClick={handleChangeName} className="text-orange-500 text-sm underline">
                Change
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Your prompt:</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe pizza without saying pizza..."
                  maxLength={200}
                  rows={3}
                  className="w-full border-2 border-orange-300 rounded-xl px-4 py-3 text-lg
                             focus:outline-none focus:border-orange-500 resize-none"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
                  <span>{prompt.length}/200</span>
                </div>
              </div>

              <button type="submit" disabled={loading || !prompt.trim()} className="btn-primary w-full">
                {loading ? "✨ Generating..." : "Submit Prompt 🎯"}
              </button>
            </form>
          </>
        )}

        {error && (
          <div className="mt-4 bg-red-100 border border-red-300 text-red-700 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="haiku-card">
              <p className="whitespace-pre-line">{result.haiku}</p>
            </div>

            {result.isPizza ? (
              <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl mb-1">🎉 Success!</p>
                <p className="font-semibold">
                  You did it in {result.wordCount} word{result.wordCount !== 1 ? "s" : ""}!
                  {result.leaderboardRank && ` Rank #${result.leaderboardRank}`}
                </p>
                <Link href="/leaderboard" className="text-green-700 underline font-semibold">
                  Check the leaderboard →
                </Link>
              </div>
            ) : (
              <div className="bg-amber-100 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-center">
                <p className="text-xl mb-1">🤔 Nice haiku, but...</p>
                <p>It&apos;s not about pizza! Try again.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Link
        href="/leaderboard"
        className="mt-6 text-white/90 hover:text-white underline text-lg"
      >
        🏆 View Leaderboard
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build main challenge page with prompt input and results"
```

---

### Task 8: Leaderboard Page

**Files:**
- Create: `src/app/leaderboard/page.tsx`

- [ ] **Step 1: Build the leaderboard page**

Create `src/app/leaderboard/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Entry {
  name: string;
  wordCount: number;
  haiku: string;
  rank: number;
}

const TROPHY = ["🥇", "🥈", "🥉"];
const ROW_STYLE = ["gold", "silver", "bronze"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  async function fetchLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setEntries(data.entries);
    } catch {
      // silently retry on next interval
    }
  }

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          🏆 Leaderboard 🏆
        </h1>
        <p className="text-white/90 mt-2 text-lg">Fewest words wins! Auto-refreshes every 10s.</p>
      </div>

      <div className="card w-full max-w-lg">
        {entries.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-lg">
            No entries yet. Be the first! 🍕
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.name}
                className={`rounded-xl px-4 py-3 ${
                  entry.rank <= 3 ? ROW_STYLE[entry.rank - 1] : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-8 text-center">
                      {entry.rank <= 3 ? TROPHY[entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <span className="font-semibold text-lg">{entry.name}</span>
                  </div>
                  <span className="font-bold text-orange-600 text-lg">
                    {entry.wordCount} word{entry.wordCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-2 text-sm italic text-gray-600 pl-11">
                  &quot;{entry.haiku}&quot;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/" className="mt-6 text-white/90 hover:text-white underline text-lg">
        ← Back to Challenge
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/leaderboard/
git commit -m "feat: build leaderboard page with auto-refresh and trophy styling"
```

---

### Task 9: QR Code Page

**Files:**
- Create: `src/app/qr/page.tsx`

- [ ] **Step 1: Build the QR code display page**

Create `src/app/qr/page.tsx`:

```tsx
import QRCode from "qrcode";

export default async function QRPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const qrDataUrl = await QRCode.toDataURL(siteUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
        🍕 Pizza Haiku Challenge 🍕
      </h1>
      <p className="text-gray-300 mb-8 text-lg">Scan to play!</p>

      <div className="bg-white rounded-3xl p-6 shadow-2xl">
        <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 md:w-80 md:h-80" />
      </div>

      <p className="text-gray-400 mt-6 text-lg font-mono">{siteUrl}</p>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/qr/
git commit -m "feat: build QR code display page for projector/laptop"
```

---

### Task 10: Smoke Test & Final Cleanup

- [ ] **Step 1: Run the dev server and test manually**

```bash
npm run dev
```

Test the following:
1. Visit `http://localhost:3000` — should see the challenge page
2. Enter a name, submit a prompt like "round cheese bread from Italy"
3. Check the result — haiku should appear, judging should work
4. Visit `http://localhost:3000/leaderboard` — should show the entry
5. Visit `http://localhost:3000/qr` — should show QR code

- [ ] **Step 2: Run the build to verify it compiles for Vercel**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address any build issues"
```

(Skip if no fixes needed.)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: pizza haiku challenge — ready for Vercel deploy"
```
