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
                className="w-full overflow-hidden"
                dangerouslySetInnerHTML={{ __html: svgContent }}
            />
        </div>
    );
};

export default SVGPreview;
