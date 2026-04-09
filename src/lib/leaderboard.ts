export interface LeaderboardEntry {
  name: string;
  charCount: number;
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
  if (!existing || entry.charCount < existing.charCount) {
    entries.set(key, entry);
  }
}

export function getLeaderboard(): (LeaderboardEntry & { rank: number })[] {
  return Array.from(entries.values())
    .sort((a, b) => a.charCount - b.charCount || a.timestamp - b.timestamp)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export function getRank(name: string): number | null {
  const board = getLeaderboard();
  const entry = board.find((e) => e.name.toLowerCase() === name.toLowerCase());
  return entry ? entry.rank : null;
}
