"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Cloud,
  Droplets,
  Eye,
  Loader2,
  MapPin,
  Thermometer,
  Wind,
  AlertTriangle,
  CloudRain,
  Sun,
  CloudSnow,
  CloudLightning,
  CloudFog,
} from "lucide-react";

interface WeatherData {
  weather: {
    name: string;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      pressure: number;
    };
    weather: Array<{ main: string; description: string; icon: string }>;
    wind: { speed: number };
    visibility: number;
    sys: { country: string };
  };
  forecast: {
    list: Array<{
      dt: number;
      main: { temp: number };
      weather: Array<{ main: string; description: string }>;
    }>;
  } | null;
  _fallback?: boolean;
}

function getWeatherIcon(main: string) {
  switch (main.toLowerCase()) {
    case "rain":
    case "drizzle":
      return <CloudRain className="h-8 w-8 text-chart-3" />;
    case "clear":
      return <Sun className="h-8 w-8 text-accent" />;
    case "snow":
      return <CloudSnow className="h-8 w-8 text-foreground" />;
    case "thunderstorm":
      return <CloudLightning className="h-8 w-8 text-accent" />;
    case "mist":
    case "haze":
    case "fog":
      return <CloudFog className="h-8 w-8 text-muted-foreground" />;
    default:
      return <Cloud className="h-8 w-8 text-muted-foreground" />;
  }
}

function getSoilHealthAlert(temp: number, humidity: number): { level: string; message: string; color: string } {
  if (humidity > 85 && temp > 25) {
    return {
      level: "Warning",
      message: "High humidity and temperature may promote fungal growth. Consider preventive fungicide application.",
      color: "text-accent",
    };
  }
  if (humidity < 30) {
    return {
      level: "Alert",
      message: "Very low humidity. Increase irrigation frequency to maintain soil moisture levels.",
      color: "text-destructive",
    };
  }
  if (temp < 5) {
    return {
      level: "Frost Alert",
      message: "Near-freezing temperatures detected. Protect sensitive crops with mulch or row covers.",
      color: "text-chart-3",
    };
  }
  if (temp > 38) {
    return {
      level: "Heat Alert",
      message: "Extreme heat detected. Ensure adequate watering and consider shade nets for crops.",
      color: "text-destructive",
    };
  }
  return {
    level: "Good",
    message: "Weather conditions are favorable for most crops. Continue regular farming activities.",
    color: "text-primary",
  };
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (lat?: number, lon?: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (lat !== undefined && lon !== undefined) {
        params.set("lat", lat.toString());
        params.set("lon", lon.toString());
      }
      const res = await fetch(`/api/weather?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Could not load weather data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather()
      );
    } else {
      fetchWeather();
    }
  }, [fetchWeather]);

  if (loading) {
    return (
      <div className="glass glow-green rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="text-center text-sm text-destructive">{error || "No data"}</p>
      </div>
    );
  }

  const { weather } = data;
  const alert = getSoilHealthAlert(weather.main.temp, weather.main.humidity);

  return (
    <div className="glass glow-green rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Weather & Soil Health</h2>
          {data._fallback && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
              Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {weather.name}, {weather.sys.country}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-6">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.weather[0].main)}
          <div>
            <p className="text-4xl font-bold text-foreground">
              {Math.round(weather.main.temp)}°C
            </p>
            <p className="text-sm capitalize text-muted-foreground">
              {weather.weather[0].description}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="glass-subtle rounded-xl p-3">
          <Thermometer className="mb-1 h-4 w-4 text-destructive" />
          <p className="text-xs text-muted-foreground">Feels Like</p>
          <p className="font-mono text-sm font-bold text-foreground">
            {Math.round(weather.main.feels_like)}°C
          </p>
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <Droplets className="mb-1 h-4 w-4 text-chart-3" />
          <p className="text-xs text-muted-foreground">Humidity</p>
          <p className="font-mono text-sm font-bold text-foreground">
            {weather.main.humidity}%
          </p>
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <Wind className="mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Wind</p>
          <p className="font-mono text-sm font-bold text-foreground">
            {weather.wind.speed} m/s
          </p>
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <Eye className="mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Visibility</p>
          <p className="font-mono text-sm font-bold text-foreground">
            {(weather.visibility / 1000).toFixed(1)} km
          </p>
        </div>
      </div>

      {/* Soil Health Alert */}
      <div className="glass-subtle rounded-xl p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${alert.color}`} />
          <span className={`text-sm font-semibold ${alert.color}`}>
            Soil Health: {alert.level}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {alert.message}
        </p>
      </div>

      {/* Forecast */}
      {data.forecast && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Upcoming Forecast
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {data.forecast.list.slice(0, 6).map((item) => (
              <div
                key={item.dt}
                className="glass-subtle flex flex-shrink-0 flex-col items-center rounded-xl px-3 py-2"
              >
                <p className="text-xs text-muted-foreground">
                  {new Date(item.dt * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="font-mono text-sm font-bold text-foreground">
                  {Math.round(item.main.temp)}°
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {item.weather[0].main}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
