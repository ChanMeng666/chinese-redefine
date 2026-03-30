"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ResultCard from "./ResultCard";
import QuotaDisplay from "./QuotaDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { getErrorMessage, validateWord } from "@/lib/errors";
import {
  cardVariants,
  formVariants,
  buttonHoverVariants,
} from "@/lib/animations";
import Image from "next/image";

interface QuotaInfo {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
}

const HanyuCardGenerator = () => {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    explanation: string;
    pinyin: string;
    english: string;
    japanese: string;
    svgContent: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [quota, setQuota] = useState<QuotaInfo>({
    dailyUsed: 0,
    dailyLimit: 3,
    monthlyUsed: 0,
    monthlyLimit: 30,
  });

  const isExhausted =
    quota.dailyUsed >= quota.dailyLimit ||
    quota.monthlyUsed >= quota.monthlyLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateWord(word);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.quota) setQuota(data.quota);
        throw new Error(data.error || "生成失败，请稍后重试");
      }

      setResult({
        id: data.id,
        explanation: data.result,
        pinyin: data.pinyin || "",
        english: data.english || "",
        japanese: data.japanese || "",
        svgContent: data.svgContent || "",
      });
      if (data.quota) setQuota(data.quota);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-12 sm:pt-20 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="mb-4"
            >
              <Image
                src="/logo-horizontal.svg"
                alt="汉语新解"
                width={280}
                height={70}
                className="h-14 sm:h-16 w-auto mx-auto"
                priority
              />
            </motion.div>
            <motion.p
              className="text-ink-light text-sm mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              用现代视角，重新诠释每一个词
            </motion.p>
            <motion.div
              className="mt-4 mx-auto w-16 h-px bg-vermillion"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Input area */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            variants={formVariants}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="输入一个词..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="w-full border-0 border-b-2 border-border focus:border-ink bg-transparent py-4 text-xl font-cn-serif text-ink placeholder:text-ink-light/40 focus:outline-none transition-colors"
                maxLength={10}
                disabled={loading}
              />
              <AnimatePresence>
                {word.length > 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 text-xs text-ink-light/60"
                  >
                    {word.length}/10
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              variants={buttonHoverVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                type="submit"
                className="w-full py-5 text-base tracking-wider"
                disabled={loading || !word.trim() || isExhausted}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在生成新解...
                  </>
                ) : isExhausted ? (
                  "配额已用完"
                ) : (
                  "生成新解卡片"
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Quota */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <QuotaDisplay
              dailyUsed={quota.dailyUsed}
              dailyLimit={quota.dailyLimit}
              monthlyUsed={quota.monthlyUsed}
              monthlyLimit={quota.monthlyLimit}
            />
          </motion.div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant="destructive" className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result !== null && (
              <motion.div
                key="result"
                className="mt-12"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={cardVariants}
              >
                <ResultCard
                  word={word}
                  explanation={result.explanation}
                  pinyin={result.pinyin}
                  english={result.english}
                  japanese={result.japanese}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default HanyuCardGenerator;
