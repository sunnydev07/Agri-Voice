import { NextRequest, NextResponse } from "next/server";
import { makePayment, addMessage, getUsers } from "@/lib/community-store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fromId, toId, amount, note } = body;

  if (!fromId || !toId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid payment data" }, { status: 400 });
  }

  const result = makePayment(fromId, toId, amount, note || "");

  if (!result) {
    return NextResponse.json({ error: "Insufficient balance or invalid users" }, { status: 400 });
  }

  // Add payment notification to chat
  addMessage({
    userId: fromId,
    userName: result.sender.name,
    userAvatar: result.sender.avatar,
    content: `Sent Rs.${amount} to ${result.receiver.name}${note ? ` - "${note}"` : ""}`,
    type: "payment",
    paymentData: {
      to: toId,
      toName: result.receiver.name,
      amount,
      note: note || "",
    },
  });

  const users = getUsers();
  return NextResponse.json({ success: true, users });
}
