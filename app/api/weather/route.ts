import { NextRequest, NextResponse } from "next/server";

// Maps Open-Meteo WMO weather codes to human-readable descriptions
function wmoToDescription(code: number): { main: string; description: string; icon: string } {
  if (code === 0) return { main: "Clear", description: "clear sky", icon: "01d" };
  if (code <= 3) return { main: "Clouds", description: "partly cloudy", icon: "02d" };
  if (code <= 49) return { main: "Fog", description: "fog", icon: "50d" };
  if (code <= 59) return { main: "Drizzle", description: "drizzle", icon: "09d" };
  if (code <= 69) return { main: "Rain", description: "rain", icon: "10d" };
  if (code <= 79) return { main: "Snow", description: "snow", icon: "13d" };
  if (code <= 84) return { main: "Rain", description: "rain showers", icon: "09d" };
  if (code <= 94) return { main: "Snow", description: "snow showers", icon: "13d" };
  return { main: "Thunderstorm", description: "thunderstorm", icon: "11d" };
}

// Fetch from Open-Meteo (free, no API key needed)
async function fetchOpenMeteo(lat: string, lon: string) {
  const currentParams = "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility";
  const hourlyParams = "temperature_2m,weather_code";

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentParams}&hourly=${hourlyParams}&forecast_hours=18&timezone=auto`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }

  const data = await res.json();
  const current = data.current;
  const hourly = data.hourly;
  const weatherInfo = wmoToDescription(current.weather_code);

  // Also reverse-geocode the location name
  let locationName = "Your Location";
  let country = "";
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { "User-Agent": "AgriVoice/1.0" } }
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      locationName = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "Your Location";
      country = geoData.address?.country_code?.toUpperCase() || "";
    }
  } catch {
    // Ignore geocoding errors
  }

  return {
    weather: {
      name: locationName,
      main: {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        pressure: Math.round(current.surface_pressure),
      },
      weather: [weatherInfo],
      wind: { speed: Math.round((current.wind_speed_10m / 3.6) * 10) / 10 },
      visibility: current.visibility || 10000,
      sys: { country },
    },
    forecast: {
      list: hourly.time.slice(0, 6).map((time: string, i: number) => ({
        dt: Math.floor(new Date(time).getTime() / 1000),
        main: { temp: hourly.temperature_2m[i] },
        weather: [wmoToDescription(hourly.weather_code[i])],
      })),
    },
  };
}

// Fetch from OpenWeatherMap (requires API key)
async function fetchOpenWeatherMap(lat: string, lon: string, apiKey: string) {
  const [weatherRes, forecastRes] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    ),
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`
    ),
  ]);

  if (!weatherRes.ok) {
    throw new Error(`OpenWeatherMap error: ${weatherRes.status}`);
  }

  const weather = await weatherRes.json();
  const forecast = forecastRes.ok ? await forecastRes.json() : null;

  return { weather, forecast };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat") || "28.6139";
  const lon = searchParams.get("lon") || "77.209";

  const apiKey = process.env.WEATHER_API_KEY;

  // Try OpenWeatherMap first if key is available
  if (apiKey) {
    try {
      const data = await fetchOpenWeatherMap(lat, lon, apiKey);
      return NextResponse.json(data);
    } catch (err) {
      console.log("[v0] OpenWeatherMap failed, falling back to Open-Meteo:", (err as Error).message);
    }
  }

  // Fallback: Use Open-Meteo (free, no API key required)
  try {
    const data = await fetchOpenMeteo(lat, lon);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Open-Meteo also failed:", error);
    // Last resort static fallback
    const now = Date.now() / 1000;
    return NextResponse.json({
      weather: {
        name: "New Delhi",
        main: { temp: 32, feels_like: 34, humidity: 62, pressure: 1008 },
        weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
        wind: { speed: 3.6 },
        visibility: 8000,
        sys: { country: "IN" },
      },
      forecast: {
        list: Array.from({ length: 6 }, (_, i) => ({
          dt: Math.floor(now + i * 10800),
          main: { temp: 30 + Math.round(Math.random() * 6 - 3) },
          weather: [{ main: "Clear", description: "partly cloudy" }],
        })),
      },
      _fallback: true,
    });
  }
}
