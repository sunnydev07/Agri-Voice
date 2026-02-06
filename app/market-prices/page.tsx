"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  IndianRupee,
  MapPin,
  BarChart3,
  ArrowUpDown,
} from "lucide-react";

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

interface MarketData {
  records: MarketRecord[];
  total: number;
  _fallback?: boolean;
}

const STATES = [
  "All States",
  "Andhra Pradesh",
  "Bihar",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Uttar Pradesh",
  "West Bengal",
];

const COMMODITIES = [
  "All Commodities",
  "Wheat",
  "Rice",
  "Onion",
  "Tomato",
  "Potato",
  "Soyabean",
  "Groundnut",
  "Maize",
  "Chilli",
  "Turmeric",
  "Cumin Seed",
  "Mustard",
  "Coconut",
];

type SortField = "commodity" | "modal_price" | "state";
type SortDir = "asc" | "desc";

export default function MarketPricesPage() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedCommodity, setSelectedCommodity] = useState("All Commodities");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("commodity");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedState !== "All States") params.set("state", selectedState);
      if (selectedCommodity !== "All Commodities")
        params.set("commodity", selectedCommodity);

      const res = await fetch(`/api/market-prices?${params.toString()}`);
      const result = await res.json();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedCommodity]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];

    let records = [...data.records];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter(
        (r) =>
          r.commodity.toLowerCase().includes(q) ||
          r.market.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.variety.toLowerCase().includes(q)
      );
    }

    // Sort
    records.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortField === "modal_price") {
        valA = Number(a.modal_price) || 0;
        valB = Number(b.modal_price) || 0;
      } else if (sortField === "state") {
        valA = a.state;
        valB = b.state;
      } else {
        valA = a.commodity;
        valB = b.commodity;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDir === "asc" ? valA - valB : valB - valA;
      }

      return sortDir === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return records;
  }, [data, searchQuery, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Summary stats
  const stats = useMemo(() => {
    if (!filteredRecords.length)
      return { avgPrice: 0, highestCommodity: "-", totalMarkets: 0 };

    const prices = filteredRecords.map((r) => Number(r.modal_price) || 0);
    const avgPrice = Math.round(
      prices.reduce((a, b) => a + b, 0) / prices.length
    );
    const highest = filteredRecords.reduce((max, r) =>
      Number(r.modal_price) > Number(max.modal_price) ? r : max
    );
    const markets = new Set(filteredRecords.map((r) => r.market));

    return {
      avgPrice,
      highestCommodity: `${highest.commodity} (${highest.market})`,
      totalMarkets: markets.size,
    };
  }, [filteredRecords]);

  const formatPrice = (price: string) => {
    const num = Number(price);
    if (!num) return price;
    return num.toLocaleString("en-IN");
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-chart-5/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="glass-strong sticky top-0 z-50 px-4 py-3 md:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-5/10">
                  <TrendingUp className="h-5 w-5 text-chart-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    Market Prices
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Live mandi rates across India
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data?._fallback && (
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                  Demo Data
                </span>
              )}
              <button
                type="button"
                onClick={fetchPrices}
                disabled={loading}
                className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground transition-all hover:glow-green disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <IndianRupee className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Price</p>
                  <p className="font-mono text-lg font-bold text-foreground">
                    {stats.avgPrice.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Rs/Quintal
                  </p>
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-5/10">
                  <TrendingUp className="h-4 w-4 text-chart-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Highest Price
                  </p>
                  <p className="truncate text-sm font-bold text-foreground">
                    {stats.highestCommodity}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Markets Listed
                  </p>
                  <p className="font-mono text-lg font-bold text-foreground">
                    {stats.totalMarkets}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="glass flex flex-1 items-center gap-2 rounded-xl px-4 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commodity, market, state..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`glass flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm transition-all ${showFilters ? "text-primary glow-green" : "text-foreground"}`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="glass mb-6 rounded-2xl p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="state-filter"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    State
                  </label>
                  <select
                    id="state-filter"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full rounded-xl bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="commodity-filter"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Commodity
                  </label>
                  <select
                    id="commodity-filter"
                    value={selectedCommodity}
                    onChange={(e) => setSelectedCommodity(e.target.value)}
                    className="w-full rounded-xl bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {COMMODITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          {loading ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Fetching latest mandi prices...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold text-foreground">
                No Results Found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="glass overflow-hidden rounded-2xl">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-4 py-3 text-left">
                          <button
                            type="button"
                            onClick={() => toggleSort("commodity")}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            Commodity
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Variety
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            type="button"
                            onClick={() => toggleSort("state")}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            Market
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                          Min Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                          Max Price
                        </th>
                        <th className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleSort("modal_price")}
                            className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            Modal Price
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record, i) => {
                        const spread =
                          Number(record.max_price) - Number(record.min_price);
                        const isHighSpread =
                          spread / Number(record.modal_price) > 0.3;
                        return (
                          <tr
                            key={`${record.commodity}-${record.market}-${i}`}
                            className="border-b border-border/20 transition-colors hover:bg-primary/[0.03]"
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-foreground">
                                {record.commodity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {record.variety}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <span className="text-sm text-foreground">
                                  {record.market}
                                </span>
                                <span className="block text-[11px] text-muted-foreground">
                                  {record.district}, {record.state}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                              {formatPrice(record.min_price)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                              {formatPrice(record.max_price)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="font-mono text-sm font-semibold text-foreground">
                                  {formatPrice(record.modal_price)}
                                </span>
                                {isHighSpread ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-chart-5" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-primary" />
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                Rs/Quintal
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredRecords.map((record, i) => (
                  <div
                    key={`${record.commodity}-${record.market}-mobile-${i}`}
                    className="glass rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {record.commodity}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {record.variety}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-bold text-foreground">
                          {formatPrice(record.modal_price)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Rs/Quintal
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {record.market}, {record.district}, {record.state}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Min:{" "}
                          <span className="font-mono text-foreground">
                            {formatPrice(record.min_price)}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Max:{" "}
                          <span className="font-mono text-foreground">
                            {formatPrice(record.max_price)}
                          </span>
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {record.arrival_date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Showing {filteredRecords.length} of {data?.total || 0} records
                {data?._fallback
                  ? " (demo data)"
                  : " from data.gov.in"}
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
