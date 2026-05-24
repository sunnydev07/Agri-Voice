import { NextRequest, NextResponse } from "next/server";

// Map country codes to newsdata.io country codes (ISO 3166-1 alpha-2, lowercase)
const COUNTRY_CODE_MAP: Record<string, string> = {
  IN: "in",
  US: "us",
  GB: "gb",
  AU: "au",
  CA: "ca",
  NG: "ng",
  PK: "pk",
  BD: "bd",
  BR: "br",
  ZA: "za",
  KE: "ke",
  ET: "et",
  GH: "gh",
  EG: "eg",
  ID: "id",
  PH: "ph",
  TH: "th",
  VN: "vn",
  CN: "cn",
  JP: "jp",
  FR: "fr",
  DE: "de",
};

interface GeoLocation {
  countryCode: string; // e.g. "IN"
  country: string;     // e.g. "India"
  region: string;      // e.g. "Delhi"
}

async function reverseGeocode(lat: string, lon: string): Promise<GeoLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=6`,
      {
        headers: { "User-Agent": "AgriVoice/1.0" },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      countryCode: (data.address?.country_code ?? "").toUpperCase(),
      country: data.address?.country ?? "",
      region:
        data.address?.state ??
        data.address?.county ??
        data.address?.city ??
        "",
    };
  } catch {
    return null;
  }
}

function getFallbackNews(region?: string) {
  const regionLabel = region ? ` in ${region}` : "";
  return {
    results: [
      {
        title: `Government Launches New Subsidy Program for Organic Farming${regionLabel}`,
        description:
          "The Ministry of Agriculture announced a new subsidy initiative to encourage organic farming practices among smallholder farmers.",
        link: "#",
        source_name: "Agri News",
        pubDate: new Date().toISOString(),
        image_url: null,
      },
      {
        title: "Wheat Prices Rise 12% Amid Global Supply Concerns",
        description:
          "Global wheat prices have seen a significant increase due to adverse weather conditions in major producing regions.",
        link: "#",
        source_name: "Farm Today",
        pubDate: new Date(Date.now() - 3600000).toISOString(),
        image_url: null,
      },
      {
        title: "New Drought-Resistant Rice Variety Released for Farmers",
        description:
          "Agricultural researchers have developed a new rice variety that can withstand prolonged drought conditions while maintaining high yields.",
        link: "#",
        source_name: "Crop Science Daily",
        pubDate: new Date(Date.now() - 7200000).toISOString(),
        image_url: null,
      },
      {
        title: "Smart Irrigation Systems Reduce Water Usage by 40%",
        description:
          "AI-powered smart irrigation systems can reduce water consumption by up to 40% while improving crop yields.",
        link: "#",
        source_name: "AgriTech Review",
        pubDate: new Date(Date.now() - 14400000).toISOString(),
        image_url: null,
      },
      {
        title: "PM-KISAN Scheme: Latest Installment Released to Eligible Farmers",
        description:
          "The government has released the latest installment of the PM-KISAN scheme, benefiting millions of farmer families.",
        link: "#",
        source_name: "Rural India",
        pubDate: new Date(Date.now() - 28800000).toISOString(),
        image_url: null,
      },
    ],
    _fallback: true,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  // Resolve location from coordinates if provided
  let geo: GeoLocation | null = null;
  if (lat && lon) {
    geo = await reverseGeocode(lat, lon);
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(getFallbackNews(geo?.region));
  }

  try {
    // Build a localised query: include the region/state name if available for finer results
    const localityTerm = geo?.region
      ? `${geo.region} agriculture farming`
      : "agriculture farming crop";

    const params = new URLSearchParams({
      apikey: apiKey,
      q: localityTerm,
      language: "en",
      size: "10",
    });

    // Add country filter when we have a recognised country code
    const countryCode = geo?.countryCode ? COUNTRY_CODE_MAP[geo.countryCode] : null;
    if (countryCode) {
      params.set("country", countryCode);
    }

    const res = await fetch(
      `https://newsdata.io/api/1/latest?${params.toString()}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      console.error("News API returned", res.status, "- using fallback data");
      return NextResponse.json(getFallbackNews(geo?.region));
    }

    const data = await res.json();

    // If the localised query returned too few results, retry with just the country filter
    if ((data.results ?? []).length < 3 && countryCode) {
      const fallbackParams = new URLSearchParams({
        apikey: apiKey,
        q: "agriculture farming crop",
        language: "en",
        country: countryCode,
        size: "10",
      });
      const fallbackRes = await fetch(
        `https://newsdata.io/api/1/latest?${fallbackParams.toString()}`,
        { next: { revalidate: 600 } }
      );
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        return NextResponse.json({
          ...fallbackData,
          _location: geo,
        });
      }
    }

    return NextResponse.json({ ...data, _location: geo });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(getFallbackNews(geo?.region));
  }
}
