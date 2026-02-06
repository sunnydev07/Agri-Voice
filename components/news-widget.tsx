"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ExternalLink,
  Loader2,
  Newspaper,
  RefreshCw,
} from "lucide-react";

interface NewsArticle {
  article_id: string;
  title: string;
  description: string | null;
  link: string;
  source_name: string;
  pubDate: string;
  image_url: string | null;
}

export function NewsWidget() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setArticles(data.results || []);
      setError(null);
    } catch {
      setError("Could not load news");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <div className="glass glow-amber rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            Agri News & Schemes
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchNews}
          disabled={loading}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          aria-label="Refresh news"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      )}

      {error && (
        <p className="py-8 text-center text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No news articles available right now.
        </p>
      )}

      {!loading && articles.length > 0 && (
        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
          {articles.map((article) => (
            <a
              key={article.article_id}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-subtle group flex gap-3 rounded-xl p-3 transition-all hover:bg-accent/5"
            >
              {article.image_url && (
                <img
                  src={article.image_url || "/placeholder.svg"}
                  alt=""
                  className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary line-clamp-2">
                  {article.title}
                </p>
                {article.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {article.description}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {article.source_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(article.pubDate).toLocaleDateString()}
                  </span>
                  <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
