import GalleryGrid from "@/components/GalleryGrid";

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl text-ink tracking-wider">
              画廊
            </h1>
            <p className="mt-2 text-ink-light text-sm">
              探索大家创作的汉语新解卡片
            </p>
            <div className="mt-4 mx-auto w-16 h-px bg-vermillion/40 animate-ink-spread origin-left" />
          </div>
          <GalleryGrid />
        </div>
      </div>
    </main>
  );
}
