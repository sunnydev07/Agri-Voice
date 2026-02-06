"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Leaf,
  X,
  Sprout,
  Droplets,
  Sun,
  ThermometerSun,
  Loader2,
  Bug,
  Mic,
  TrendingUp,
} from "lucide-react";

interface CropResult {
  id: string;
  attributes: {
    name: string;
    description: string;
    sun_requirements: string;
    sowing_method: string;
    row_spacing: { value: number; unit: string } | null;
    height: { value: number; unit: string } | null;
    spread: { value: number; unit: string } | null;
    growing_degree_days: number | null;
    main_image_path: string | null;
    tags_array: string[];
  };
}

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CropResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<CropResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchCrops = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/crops?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCrops(value), 400);
  };

  return (
    <>
      <nav className="glass-strong sticky top-0 z-50 px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Agri-Voice
              </h1>
              <p className="hidden text-xs text-muted-foreground md:block">
                Smart Farming Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/disease-scanner"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
              >
                <Bug className="h-3.5 w-3.5" />
                Scanner
              </Link>
              <Link
                href="/voice-assistant"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
              >
                <Mic className="h-3.5 w-3.5" />
                Voice AI
              </Link>
              <Link
                href="/market-prices"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-chart-5/10 hover:text-chart-5"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Prices
              </Link>
            </nav>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition-all hover:text-foreground hover:glow-green"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Search crops...</span>
            </button>
            <div className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 lg:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-xs text-primary">AI Active</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
              setResults([]);
              setSelectedCrop(null);
            }}
            onKeyDown={() => {}}
            role="presentation"
          />
          <div className="glass-strong glow-green relative mx-4 w-full max-w-2xl rounded-2xl p-1">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="h-5 w-5 text-primary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search for any crop (e.g., tomato, rice, wheat)..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                  setResults([]);
                  setSelectedCrop(null);
                }}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selected Crop Detail */}
            {selectedCrop && (
              <div className="border-t border-border/50 p-4">
                <button
                  type="button"
                  onClick={() => setSelectedCrop(null)}
                  className="mb-3 text-xs text-primary hover:underline"
                >
                  Back to results
                </button>
                <div className="flex gap-4">
                  {selectedCrop.attributes.main_image_path && (
                    <img
                      src={selectedCrop.attributes.main_image_path || "/placeholder.svg"}
                      alt={selectedCrop.attributes.name}
                      className="h-24 w-24 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {selectedCrop.attributes.name}
                    </h3>
                    {selectedCrop.attributes.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                        {selectedCrop.attributes.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {selectedCrop.attributes.sun_requirements && (
                    <div className="glass rounded-xl p-3">
                      <Sun className="mb-1 h-4 w-4 text-accent" />
                      <p className="text-xs text-muted-foreground">Sunlight</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedCrop.attributes.sun_requirements}
                      </p>
                    </div>
                  )}
                  {selectedCrop.attributes.sowing_method && (
                    <div className="glass rounded-xl p-3">
                      <Sprout className="mb-1 h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Sowing</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedCrop.attributes.sowing_method}
                      </p>
                    </div>
                  )}
                  {selectedCrop.attributes.row_spacing?.value && (
                    <div className="glass rounded-xl p-3">
                      <Droplets className="mb-1 h-4 w-4 text-chart-3" />
                      <p className="text-xs text-muted-foreground">Row Spacing</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedCrop.attributes.row_spacing.value}{" "}
                        {selectedCrop.attributes.row_spacing.unit}
                      </p>
                    </div>
                  )}
                  {selectedCrop.attributes.growing_degree_days && (
                    <div className="glass rounded-xl p-3">
                      <ThermometerSun className="mb-1 h-4 w-4 text-destructive" />
                      <p className="text-xs text-muted-foreground">Grow Days</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedCrop.attributes.growing_degree_days}
                      </p>
                    </div>
                  )}
                </div>
                {selectedCrop.attributes.tags_array?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedCrop.attributes.tags_array.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search Results */}
            {!selectedCrop && results.length > 0 && (
              <div className="max-h-80 overflow-y-auto border-t border-border/50">
                {results.map((crop) => (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCrop(crop)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5"
                  >
                    {crop.attributes.main_image_path ? (
                      <img
                        src={crop.attributes.main_image_path || "/placeholder.svg"}
                        alt={crop.attributes.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Sprout className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-foreground">
                        {crop.attributes.name}
                      </p>
                      {crop.attributes.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {crop.attributes.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!selectedCrop && query && !loading && results.length === 0 && (
              <div className="border-t border-border/50 p-6 text-center">
                <Sprout className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No crops found for &quot;{query}&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
