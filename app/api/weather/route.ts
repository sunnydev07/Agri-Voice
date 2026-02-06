import { NextRequest, NextResponse } from "next/server";

function getFallbackWeather() {
  const now = Date.now() / 1000;
  return {
    weather: {
      name: "New Delhi",
      main: {
        temp: 32,
        feels_like: 34,
        humidity: 62,
        pressure: 1008,
      },
      weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
      wind: { speed: 3.6 },
      visibility: 8000,
      sys: { country: "IN" },
    },
    forecast: {
      list: Array.from({ length: 6 }, (_, i) => ({
        dt: Math.floor(now + i * 10800),
        main: { temp: 30 + Math.round(Math.random() * 6 - 3) },
        weather: [
          {
            main: ["Clear", "Clouds", "Clear", "Clouds", "Clear", "Clear"][i],
            description: "partly cloudy",
          },
        ],
      })),
    },
    _fallback: true,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat") || "28.6139";
  const lon = searchParams.get("lon") || "77.209";

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    console.log("[v0] WEATHER_API_KEY not set, returning fallback data");
    return NextResponse.json(getFallbackWeather());
  }

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`
      ),
    ]);

    if (!weatherRes.ok) {
      console.error(
        "Weather API returned",
        weatherRes.status,
        "- using fallback data"
      );
      return NextResponse.json(getFallbackWeather());
    }

    const weather = await weatherRes.json();
    const forecast = forecastRes.ok ? await forecastRes.json() : null;

    return NextResponse.json({ weather, forecast });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(getFallbackWeather());
  }
}
