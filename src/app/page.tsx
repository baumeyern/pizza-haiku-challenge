"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { validateName, validatePrompt, countCharacters } from "@/lib/validation";

interface SubmitResult {
  haiku: string;
  isPizza: boolean;
  charCount: number;
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

  const charCount = prompt.trim() ? countCharacters(prompt.trim()) : 0;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          🍕 Pizza Haiku Challenge 🍕
        </h1>
        <p className="text-white/90 mt-3 text-lg max-w-md mx-auto">
          Get the AI to write a haiku about pizza — without using the words
          pizza, cheese, sauce, or dough in your prompt. Fewest characters wins!
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
                  placeholder="Describe pizza without saying pizza, cheese, sauce, or dough..."
                  maxLength={200}
                  rows={3}
                  className="w-full border-2 border-orange-300 rounded-xl px-4 py-3 text-lg
                             focus:outline-none focus:border-orange-500 resize-none"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{charCount} char{charCount !== 1 ? "s" : ""}</span>
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
                  You did it in {result.charCount} char{result.charCount !== 1 ? "s" : ""}!
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
