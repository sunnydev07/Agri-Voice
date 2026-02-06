import { NextResponse } from "next/server";
import { getUsers } from "@/lib/community-store";

export async function GET() {
  const users = getUsers();
  return NextResponse.json({ users });
}
