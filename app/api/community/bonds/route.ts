import { NextRequest, NextResponse } from "next/server";
import { getBonds, addBond, fundBond, repayBond, addMessage, getUser } from "@/lib/community-store";

export async function GET() {
  const bonds = getBonds();
  return NextResponse.json({ bonds });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "create") {
    const { borrowerId, borrowerName, amount, interestRate, durationDays, purpose } = body;

    if (!borrowerId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid bond data" }, { status: 400 });
    }

    const bond = addBond({
      borrowerId,
      borrowerName,
      amount,
      interestRate: interestRate || 3,
      durationDays: durationDays || 90,
      purpose: purpose || "",
    });

    const user = getUser(borrowerId);
    if (user) {
      addMessage({
        userId: borrowerId,
        userName: user.name,
        userAvatar: user.avatar,
        content: `Created a bond request for Rs.${amount} at ${interestRate}% for ${durationDays} days - "${purpose}"`,
        type: "bond",
      });
    }

    return NextResponse.json({ bond });
  }

  if (action === "fund") {
    const { bondId, lenderId, lenderName } = body;
    const bond = fundBond(bondId, lenderId, lenderName);

    if (!bond) {
      return NextResponse.json({ error: "Cannot fund this bond" }, { status: 400 });
    }

    const lender = getUser(lenderId);
    if (lender) {
      addMessage({
        userId: lenderId,
        userName: lender.name,
        userAvatar: lender.avatar,
        content: `Funded ${bond.borrowerName}'s bond of Rs.${bond.amount}`,
        type: "bond",
      });
    }

    return NextResponse.json({ bond });
  }

  if (action === "repay") {
    const { bondId } = body;
    const bond = repayBond(bondId);

    if (!bond) {
      return NextResponse.json({ error: "Cannot repay this bond" }, { status: 400 });
    }

    const borrower = getUser(bond.borrowerId);
    if (borrower) {
      addMessage({
        userId: bond.borrowerId,
        userName: borrower.name,
        userAvatar: borrower.avatar,
        content: `Repaid bond of Rs.${bond.amount} to ${bond.lenderName}`,
        type: "bond",
      });
    }

    return NextResponse.json({ bond });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
