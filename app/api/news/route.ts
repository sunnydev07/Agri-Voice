import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "News API key not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=agriculture%20farming%20crop&language=en&size=10`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      throw new Error(`News API error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
