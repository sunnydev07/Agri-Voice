import { NextResponse } from "next/server";

function getFallbackNews() {
  return {
    results: [
      {
        title: "Government Launches New Subsidy Program for Organic Farming",
        description:
          "The Ministry of Agriculture announced a new subsidy initiative to encourage organic farming practices among smallholder farmers across the country.",
        link: "#",
        source_name: "Agri News",
        pubDate: new Date().toISOString(),
        image_url: null,
      },
      {
        title: "Wheat Prices Rise 12% Amid Global Supply Concerns",
        description:
          "Global wheat prices have seen a significant increase due to adverse weather conditions in major producing regions, impacting both farmers and consumers.",
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
          "A new study shows that AI-powered smart irrigation systems can reduce water consumption by up to 40% while improving crop yields.",
        link: "#",
        source_name: "AgriTech Review",
        pubDate: new Date(Date.now() - 14400000).toISOString(),
        image_url: null,
      },
      {
        title: "PM-KISAN Scheme: 15th Installment Released to Eligible Farmers",
        description:
          "The government has released the 15th installment of the PM-KISAN scheme, benefiting millions of farmer families with direct income support.",
        link: "#",
        source_name: "Rural India",
        pubDate: new Date(Date.now() - 28800000).toISOString(),
        image_url: null,
      },
    ],
    _fallback: true,
  };
}

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(getFallbackNews());
  }

  try {
    const res = await fetch(
      `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=agriculture%20farming%20crop&language=en&size=10`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      console.error("News API returned", res.status, "- using fallback data");
      return NextResponse.json(getFallbackNews());
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(getFallbackNews());
  }
}
