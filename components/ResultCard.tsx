import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import DownloadButton from './DownloadButton';
import SVGPreview from './SVGPreview';
import { buttonHoverVariants, fadeInVariants, lineRevealVariants } from '@/lib/animations';

interface ResultCardProps {
    word: string;
    explanation: string;
    pinyin?: string;
    english?: string;
    japanese?: string;
}

const ResultCard = ({ word, explanation, pinyin, english, japanese }: ResultCardProps) => {
    const [showPreview, setShowPreview] = useState(false);

    return (
        <div className="space-y-6">
            {/* Ink-spread separator */}
            <motion.div
                className="h-px bg-ink/20 origin-left"
                variants={lineRevealVariants}
                initial="hidden"
                animate="visible"
            />

            {/* Word display */}
            <motion.div
                className="font-display text-4xl text-ink"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                {word}
            </motion.div>

            {/* Pinyin / English / Japanese annotations */}
            {(pinyin || english || japanese) && (
                <motion.div
                    className="flex flex-wrap gap-x-4 gap-y-1 font-latin-serif text-sm text-ink-light italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {pinyin && <span>{pinyin}</span>}
                    {english && <span>{english}</span>}
                    {japanese && <span>{japanese}</span>}
                </motion.div>
            )}

            {/* Explanation */}
            <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
            >
                <p className="font-cn-serif text-lg leading-loose text-ink">
                    {explanation}
                </p>
            </motion.div>

            {/* Footer: attribution + actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <motion.div
                    className="text-xs text-ink-light/50 font-display tracking-widest order-2 sm:order-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    汉语新解
                </motion.div>

                <div className="flex flex-wrap gap-2 order-1 sm:order-2 w-full sm:w-auto">
                    <motion.div
                        className="w-full sm:w-auto"
                        variants={buttonHoverVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Button
                            variant="outline"
                            onClick={() => setShowPreview(!showPreview)}
                            className="w-full sm:w-auto text-sm flex items-center h-9"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            {showPreview ? '隐藏预览' : '预览卡片'}
                        </Button>
                    </motion.div>
                    <motion.div
                        className="w-full sm:w-auto"
                        variants={buttonHoverVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <DownloadButton
                            word={word}
                            explanation={explanation}
                            pinyin={pinyin}
                            english={english}
                            japanese={japanese}
                        />
                    </motion.div>
                </div>
            </div>

            {/* SVG Preview */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <SVGPreview
                            word={word}
                            explanation={explanation}
                            pinyin={pinyin}
                            english={english}
                            japanese={japanese}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResultCard;
