"use client";

import { motion } from "framer-motion";

interface CardThumbnailProps {
  word: string;
  explanation: string;
  svgContent: string;
  createdAt: string;
}

export default function CardThumbnail({
  svgContent,
  createdAt,
}: CardThumbnailProps) {
  return (
    <motion.div
      className="break-inside-avoid mb-6 bg-card border border-border/60 rounded-lg overflow-hidden hover:border-border hover:shadow-sm transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
    >
      <div
        className="w-full [&_svg]:w-full [&_svg]:h-auto [&_svg]:block"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <div className="px-3 py-2">
        <div className="flex justify-end items-center text-xs text-ink-light font-latin-serif">
          <span>{new Date(createdAt).toLocaleDateString("zh-CN")}</span>
        </div>
      </div>
    </motion.div>
  );
}
