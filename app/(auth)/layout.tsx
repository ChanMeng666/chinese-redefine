export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4 relative">
      {/* Decorative background character */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 opacity-[0.03] text-ink select-none">
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
            <text
              x="100"
              y="140"
              textAnchor="middle"
              fontSize="180"
              fontFamily="KaiTi, STKaiti, serif"
              fill="currentColor"
            >
              解
            </text>
          </svg>
        </div>
      </div>

      {/* Brand mark */}
      <div className="mb-8 text-center relative z-10">
        <h1 className="font-display text-2xl text-ink tracking-widest">
          汉语新解
        </h1>
        <div className="mt-3 mx-auto w-12 h-px bg-vermillion animate-ink-spread origin-left" />
      </div>

      <div className="w-full max-w-sm relative z-10">{children}</div>
    </div>
  );
}
