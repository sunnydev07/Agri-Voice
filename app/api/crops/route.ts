import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://openfarm.cc/api/v1/crops?filter=${encodeURIComponent(query)}`
    );

    if (!res.ok) {
      throw new Error(`OpenFarm API error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Crop search error:", error);
    return NextResponse.json(
      { error: "Failed to search crops" },
      { status: 500 }
    );
  }
}
