import React, { useEffect, useState } from 'react';
import { generateSVGCard } from '@/lib/svgGenerator';

interface SVGPreviewProps {
    word: string;
    explanation: string;
}

const SVGPreview: React.FC<SVGPreviewProps> = ({ word, explanation }) => {
    const [svgContent, setSvgContent] = useState('');

    useEffect(() => {
        const svg = generateSVGCard({ word, explanation });
        setSvgContent(svg);
    }, [word, explanation]);

    return (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <div
                className="w-full flex justify-center items-center"
                style={{ minHeight: '200px' }}
            >
                <div
                    className="w-full max-w-full svg-container"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            </div>
            <style jsx>{`
                .svg-container svg {
                    width: 100% !important;
                    height: auto !important;
                    max-width: 100% !important;
                    display: block;
                }
            `}</style>
        </div>
    );
};

export default SVGPreview;
