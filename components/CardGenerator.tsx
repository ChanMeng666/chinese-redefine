'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ResultCard from './ResultCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import {getErrorMessage, validateWord} from "@/lib/errors";
import { cardVariants, formVariants, buttonHoverVariants } from '@/lib/animations';


const HanyuCardGenerator = () => {
    const [word, setWord] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [remainingRequests, setRemainingRequests] = useState(5);

    // 显示剩余请求进度条
    const progressValue = (remainingRequests / 5) * 100;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateWord(word);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ word: word.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '生成失败，请稍后重试');
            }

            if (data.error) {
                throw new Error(data.error);
            }

            setResult(data.result);
            setRemainingRequests(data.remaining);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-4 sm:py-12 sm:px-6 lg:px-8">
                <motion.div
                    className="max-w-2xl mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                >
                    <Card className="shadow-lg">
                        {/*<CardHeader className="space-y-2 px-4 sm:px-6">*/}
                        {/*    <motion.div*/}
                        {/*        initial={{ opacity: 0, y: -20 }}*/}
                        {/*        animate={{ opacity: 1, y: 0 }}*/}
                        {/*        transition={{ delay: 0.2 }}*/}
                        {/*    >*/}
                        {/*        <CardTitle className="text-center text-2xl sm:text-3xl font-bold break-words">*/}
                        {/*            汉语新解卡片生成器*/}
                        {/*        </CardTitle>*/}
                        {/*        <p className="text-center text-sm text-slate-500 mt-2">*/}
                        {/*            用现代视角重新诠释汉语词汇*/}
                        {/*        </p>*/}
                        {/*    </motion.div>*/}
                        {/*</CardHeader>*/}
                        <CardHeader className="space-y-2 px-4 sm:px-6">
                            <motion.div
                                initial={{opacity: 0, y: -20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.2}}
                            >
                                <CardTitle className="text-center text-2xl sm:text-3xl font-bold break-words">
                                    汉语新解卡片生成器
                                </CardTitle>
                                <div className="flex flex-col items-center space-y-2">
                                    <p className="text-center text-sm text-slate-500 mt-2">
                                        用现代视角重新诠释汉语词汇
                                    </p>
                                    <p className="text-center text-xs text-slate-400 flex items-center gap-1.5">
                                        Created by{' '}
                                        <a
                                            href="https://github.com/ChanMeng666/chinese-redefine"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-600 transition-colors duration-200 inline-flex items-center gap-1.5"
                                        >
                                            Chan Meng
                                            <span className="inline-block animate-heartbeat">💛</span>
                                        </a>
                                    </p>
                                </div>
                            </motion.div>
                        </CardHeader>
                        <CardContent className="space-y-6 px-4 sm:px-6">
                            <motion.form
                                onSubmit={handleSubmit}
                                className="space-y-4"
                                variants={formVariants}
                            >
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="输入想要重新诠释的汉语词汇..."
                                        value={word}
                                        onChange={(e) => setWord(e.target.value)}
                                        className="w-full py-4 sm:py-6 text-base sm:text-lg"
                                        maxLength={10}
                                        disabled={loading}
                                    />
                                    <AnimatePresence>
                                        {word.length > 0 && (
                                            <motion.span
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm text-slate-400"
                                            >
                                                {word.length}/10
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <motion.div variants={buttonHoverVariants} whileHover="hover" whileTap="tap">
                                    <Button
                                        type="submit"
                                        className="w-full py-4 sm:py-6 text-base sm:text-lg"
                                        disabled={loading || !word.trim()}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                                正在生成新解...
                                            </>
                                        ) : (
                                            '生成新解卡片'
                                        )}
                                    </Button>
                                </motion.div>
                            </motion.form>

                            {/* Progress bar section */}
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex justify-between text-xs sm:text-sm text-slate-500">
                                    <span>剩余请求次数</span>
                                    <span>{remainingRequests}/5</span>
                                </div>
                                <Progress value={progressValue} className="h-1.5 sm:h-2" />
                            </motion.div>

                            {/* Error message */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
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

                            {/* Result card */}
                            <AnimatePresence mode="wait">
                                {result && (
                                    <motion.div
                                        key="result"
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={cardVariants}
                                    >
                                        <ResultCard word={word} explanation={result} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default HanyuCardGenerator;
