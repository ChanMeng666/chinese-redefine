"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import CardThumbnail from "./CardThumbnail";

interface GalleryCard {
  id: string;
  word: string;
  explanation: string;
  svgContent: string;
  createdAt: string;
}

export default function GalleryGrid() {
  const [cards, setCards] = useState<GalleryCard[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async (q: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));

    const res = await fetch(`/api/gallery?${params}`);
    const data = await res.json();
    setCards((prev) => (p === 1 ? data.cards : [...prev, ...data.cards]));
    setTotalPages(data.totalPages);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCards("", 1);
  }, [fetchCards]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCards(search, 1);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchCards(search, next);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light/40" />
          <Input
            type="text"
            placeholder="搜索词语..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          搜索
        </Button>
      </form>

      {loading && cards.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-ink-light" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 font-display text-ink-light">
          暂无卡片
        </div>
      ) : (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {cards.map((card) => (
              <CardThumbnail
                key={card.id}
                word={card.word}
                explanation={card.explanation}
                svgContent={card.svgContent}
                createdAt={card.createdAt}
              />
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleLoadMore}
                disabled={loading}
                className="underline-offset-4 hover:underline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                加载更多
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
