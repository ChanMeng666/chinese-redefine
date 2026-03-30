import type { Metadata } from "next";
import { Noto_Serif_SC, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Github, Mail } from "lucide-react";

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cn-serif",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-latin-serif",
});

export const metadata: Metadata = {
  title: "汉语新解卡片生成器",
  description: "用现代视角重新诠释汉语词汇",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=LXGW+WenKai:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${notoSerifSC.variable} ${sourceSerif.variable} font-cn-serif antialiased`}
        style={{ "--font-display": "'LXGW WenKai', KaiTi, STKaiti, serif" } as React.CSSProperties}
      >
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>

        {/* Global minimal footer */}
        <footer className="border-t border-border/40 py-6 px-4">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-ink-light/60">
            <span>Built by Chan Meng</span>
            <span className="hidden sm:inline">·</span>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/ChanMeng666"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-ink-light transition-colors"
              >
                <Github className="h-3 w-3" />
                GitHub
              </a>
              <a
                href="mailto:chanmeng.dev@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-ink-light transition-colors"
              >
                <Mail className="h-3 w-3" />
                联系
              </a>
              <a
                href="https://github.com/ChanMeng666/chinese-redefine"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink-light transition-colors"
              >
                项目仓库
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
