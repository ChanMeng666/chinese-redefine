import React, { useEffect, useState } from 'react';
import { generateSVGCard } from '@/lib/svgGenerator';

interface SVGPreviewProps {
    word: string;
    explanation: string;
    pinyin?: string;
    english?: string;
    japanese?: string;
}

const SVGPreview: React.FC<SVGPreviewProps> = ({ word, explanation, pinyin, english, japanese }) => {
    const [svgContent, setSvgContent] = useState('');

    useEffect(() => {
        const svg = generateSVGCard({ word, explanation, pinyin, english, japanese });
        setSvgContent(svg);
    }, [word, explanation, pinyin, english, japanese]);

    return (
        <div className="mt-6 bg-card border border-border rounded-lg p-4">
            <div
                className="w-full flex justify-center items-center"
                style={{ minHeight: '200px' }}
            >
                <div
                    className="w-full max-w-full [&_svg]:w-full [&_svg]:h-auto [&_svg]:block"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            </div>
        </div>
    );
};

export default SVGPreview;
