import GalleryGrid from "@/components/GalleryGrid";

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">卡片画廊</h1>
          <p className="text-center text-slate-500 mb-8">
            探索大家创作的汉语新解卡片
          </p>
          <GalleryGrid />
        </div>
      </div>
    </main>
  );
}
