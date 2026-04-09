import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = getLeaderboard();
  return NextResponse.json({ entries });
}
