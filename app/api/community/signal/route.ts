import { NextRequest, NextResponse } from "next/server";
import { addSignal, getSignals } from "@/lib/community-store";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const since = request.nextUrl.searchParams.get("since");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const signals = getSignals(userId, since ? Number(since) : 0);
  return NextResponse.json({ signals });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { from, to, type, data } = body;

  if (!from || !to || !type) {
    return NextResponse.json({ error: "Missing signal data" }, { status: 400 });
  }

  addSignal({ from, to, type, data, timestamp: Date.now() });
  return NextResponse.json({ success: true });
}
