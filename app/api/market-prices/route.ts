import { NextRequest, NextResponse } from "next/server";

interface MarketRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
}

// Fetch from data.gov.in API for Indian agricultural commodity prices
async function fetchMandiPrices(state?: string, commodity?: string) {
  const apiKey = process.env.DATA_GOV_API_KEY;

  // Build URL for data.gov.in commodity prices
  let url =
    "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=";

  if (apiKey) {
    url += apiKey;
  } else {
    // Use the open data default key
    url += "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
  }

  url += "&format=json&limit=50";

  if (state) {
    url += `&filters[state]=${encodeURIComponent(state)}`;
  }
  if (commodity) {
    url += `&filters[commodity]=${encodeURIComponent(commodity)}`;
  }

  const res = await fetch(url, { next: { revalidate: 1800 } });

  if (!res.ok) {
    throw new Error(`data.gov.in API error: ${res.status}`);
  }

  return res.json();
}

// Fallback data representative of real Indian mandi prices
function getFallbackPrices() {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  const records: MarketRecord[] = [
    { state: "Maharashtra", district: "Pune", market: "Pune", commodity: "Wheat", variety: "Lokwan", arrival_date: dateStr, min_price: "2200", max_price: "2650", modal_price: "2450" },
    { state: "Maharashtra", district: "Nashik", market: "Nashik", commodity: "Onion", variety: "Red", arrival_date: dateStr, min_price: "800", max_price: "1500", modal_price: "1200" },
    { state: "Punjab", district: "Ludhiana", market: "Ludhiana", commodity: "Rice", variety: "Basmati", arrival_date: dateStr, min_price: "3800", max_price: "4500", modal_price: "4200" },
    { state: "Punjab", district: "Amritsar", market: "Amritsar", commodity: "Wheat", variety: "PBW-343", arrival_date: dateStr, min_price: "2150", max_price: "2500", modal_price: "2350" },
    { state: "Uttar Pradesh", district: "Agra", market: "Agra", commodity: "Potato", variety: "Jyoti", arrival_date: dateStr, min_price: "600", max_price: "950", modal_price: "800" },
    { state: "Madhya Pradesh", district: "Indore", market: "Indore", commodity: "Soyabean", variety: "Yellow", arrival_date: dateStr, min_price: "4300", max_price: "4800", modal_price: "4550" },
    { state: "Karnataka", district: "Bangalore", market: "Yeshwanthpur", commodity: "Tomato", variety: "Local", arrival_date: dateStr, min_price: "1000", max_price: "2200", modal_price: "1600" },
    { state: "Rajasthan", district: "Jodhpur", market: "Jodhpur", commodity: "Cumin Seed", variety: "Other", arrival_date: dateStr, min_price: "38000", max_price: "42000", modal_price: "40000" },
    { state: "Gujarat", district: "Rajkot", market: "Rajkot", commodity: "Groundnut", variety: "Bold", arrival_date: dateStr, min_price: "5200", max_price: "5800", modal_price: "5500" },
    { state: "Tamil Nadu", district: "Coimbatore", market: "Coimbatore", commodity: "Coconut", variety: "Medium", arrival_date: dateStr, min_price: "2500", max_price: "3200", modal_price: "2850" },
    { state: "Haryana", district: "Karnal", market: "Karnal", commodity: "Rice", variety: "1121 Basmati", arrival_date: dateStr, min_price: "3500", max_price: "4100", modal_price: "3800" },
    { state: "West Bengal", district: "Hooghly", market: "Hooghly", commodity: "Mustard", variety: "Black", arrival_date: dateStr, min_price: "5000", max_price: "5600", modal_price: "5300" },
    { state: "Andhra Pradesh", district: "Guntur", market: "Guntur", commodity: "Chilli", variety: "Teja S17", arrival_date: dateStr, min_price: "12000", max_price: "15000", modal_price: "13500" },
    { state: "Maharashtra", district: "Sangli", market: "Sangli", commodity: "Turmeric", variety: "Finger", arrival_date: dateStr, min_price: "8500", max_price: "12000", modal_price: "10200" },
    { state: "Bihar", district: "Patna", market: "Patna", commodity: "Maize", variety: "Yellow", arrival_date: dateStr, min_price: "1800", max_price: "2200", modal_price: "2000" },
  ];

  return {
    records,
    total: records.length,
    _fallback: true,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get("state") || undefined;
  const commodity = searchParams.get("commodity") || undefined;

  try {
    const data = await fetchMandiPrices(state, commodity);

    if (data?.records && data.records.length > 0) {
      return NextResponse.json({
        records: data.records,
        total: data.total,
      });
    }

    // If API returns no records, use fallback
    return NextResponse.json(getFallbackPrices());
  } catch (error) {
    console.error("Market prices API error:", error);
    return NextResponse.json(getFallbackPrices());
  }
}
