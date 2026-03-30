"use client";

import { motion } from "framer-motion";

interface CardThumbnailProps {
  word: string;
  explanation: string;
  svgContent: string;
  authorName: string;
  createdAt: string;
}

export default function CardThumbnail({
  svgContent,
  authorName,
  createdAt,
}: CardThumbnailProps) {
  return (
    <motion.div
      className="break-inside-avoid mb-4 bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div
        className="w-full"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <div className="p-3">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>{authorName}</span>
          <span>{new Date(createdAt).toLocaleDateString("zh-CN")}</span>
        </div>
      </div>
    </motion.div>
  );
}
