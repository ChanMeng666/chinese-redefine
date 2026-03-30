"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, Download } from "lucide-react";

interface UserCard {
  id: string;
  word: string;
  explanation: string;
  pinyin: string | null;
  svgContent: string;
  isPublic: boolean;
  createdAt: string;
}

export default function MyCardsPage() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cards/mine")
      .then((res) => res.json())
      .then((data) => {
        setCards(data.cards);
        setLoading(false);
      });
  }, []);

  const toggleVisibility = async (id: string, isPublic: boolean) => {
    setTogglingId(id);
    const res = await fetch(`/api/cards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    const data = await res.json();
    if (data.success) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, isPublic: data.isPublic } : c
        )
      );
    }
    setTogglingId(null);
  };

  const downloadSvg = (card: UserCard) => {
    const blob = new Blob([card.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.word}-汉语新解.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">我的卡片</h1>

          {cards.length === 0 ? (
            <p className="text-center text-slate-400 py-20">
              还没有生成过卡片
            </p>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <Card key={card.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-lg">{card.word}</div>
                      <div className="text-sm text-slate-500 truncate">
                        {card.explanation}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(card.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleVisibility(card.id, card.isPublic)
                        }
                        disabled={togglingId === card.id}
                        title={card.isPublic ? "设为隐藏" : "设为公开"}
                      >
                        {togglingId === card.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : card.isPublic ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadSvg(card)}
                        title="下载 SVG"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
