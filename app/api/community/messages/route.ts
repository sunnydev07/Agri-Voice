import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage, getUsers } from "@/lib/community-store";

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get("since");
  const messages = getMessages(since ? Number(since) : undefined);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, content, type, imageUrl, paymentData, bondData } = body;

  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  const msg = addMessage({
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content,
    type: type || "text",
    imageUrl,
    paymentData,
    bondData,
  });

  return NextResponse.json({ message: msg });
}
