import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generateSVGCard } from '@/lib/svgGenerator';

interface DownloadButtonProps {
    word: string;
    explanation: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ word, explanation }) => {
    const handleDownload = () => {
        // 生成SVG
        const svgContent = generateSVGCard({ word, explanation });

        // 创建Blob
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        // 创建下载链接
        const link = document.createElement('a');
        link.href = url;
        link.download = `${word}-汉语新解.svg`;
        document.body.appendChild(link);
        link.click();

        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full sm:w-auto text-sm flex items-center h-9"
        >
            <Download className="w-4 h-4 mr-2" />
            下载卡片
        </Button>
    );
};

export default DownloadButton;
