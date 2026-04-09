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
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Submit error:", message);
    return NextResponse.json({ error: `Something went wrong: ${message}` }, { status: 500 });
  }
}
