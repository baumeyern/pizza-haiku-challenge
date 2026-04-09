"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Entry {
  name: string;
  charCount: number;
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
        <p className="text-white/90 mt-2 text-lg">Fewest characters wins! Auto-refreshes every 10s.</p>
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
                    {entry.charCount} char{entry.charCount !== 1 ? "s" : ""}
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
