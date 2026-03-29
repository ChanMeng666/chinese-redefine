interface SVGCardOptions {
    word: string;
    explanation: string;
    pinyin?: string;
    english?: string;
    japanese?: string;
}

// 基于词语生成确定性hash，用于选择布局
const hashWord = (word: string): number => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

// 蒙德里安风格配色方案
const MONDRIAN_PALETTES = [
    { bg: '#F5F0E8', accent1: '#C70000', accent2: '#0033A0', accent3: '#FFD700' },
    { bg: '#F0EDE5', accent1: '#D4351C', accent2: '#1D70B8', accent3: '#F5D547' },
    { bg: '#FAF7F0', accent1: '#BE3A34', accent2: '#2E5FA1', accent3: '#E8C547' },
    { bg: '#F2EFE4', accent1: '#C41E3A', accent2: '#003DA5', accent3: '#FFC72C' },
    { bg: '#F7F3EB', accent1: '#CF2A2A', accent2: '#1B4F9B', accent3: '#F0C040' },
];

// 蒙德里安风格背景布局
const MONDRIAN_LAYOUTS = [
    // 布局1: 左上角色块 + 右下角色块
    (p: typeof MONDRIAN_PALETTES[0]) => `
        <rect x="0" y="0" width="120" height="80" fill="${p.accent1}" />
        <rect x="300" y="500" width="100" height="100" fill="${p.accent2}" />
        <rect x="0" y="540" width="60" height="60" fill="${p.accent3}" />`,
    // 布局2: 顶部横条 + 右侧竖条
    (p: typeof MONDRIAN_PALETTES[0]) => `
        <rect x="0" y="0" width="400" height="40" fill="${p.accent1}" />
        <rect x="350" y="40" width="50" height="560" fill="${p.accent2}" />
        <rect x="0" y="560" width="80" height="40" fill="${p.accent3}" />`,
    // 布局3: 左侧竖条 + 底部横条
    (p: typeof MONDRIAN_PALETTES[0]) => `
        <rect x="0" y="0" width="50" height="600" fill="${p.accent2}" />
        <rect x="50" y="550" width="350" height="50" fill="${p.accent1}" />
        <rect x="330" y="0" width="70" height="50" fill="${p.accent3}" />`,
    // 布局4: 四角点缀
    (p: typeof MONDRIAN_PALETTES[0]) => `
        <rect x="0" y="0" width="80" height="60" fill="${p.accent1}" />
        <rect x="340" y="0" width="60" height="80" fill="${p.accent2}" />
        <rect x="0" y="550" width="100" height="50" fill="${p.accent3}" />
        <rect x="350" y="530" width="50" height="70" fill="${p.accent1}" opacity="0.6" />`,
    // 布局5: 不对称大色块
    (p: typeof MONDRIAN_PALETTES[0]) => `
        <rect x="0" y="0" width="160" height="100" fill="${p.accent1}" />
        <rect x="0" y="100" width="50" height="200" fill="${p.accent2}" />
        <rect x="300" y="500" width="100" height="100" fill="${p.accent3}" />`,
    // 布局6: 右上 + 左下对角
    (p: typeof MONDRIAN_PALETTES[0]) => `
        <rect x="300" y="0" width="100" height="120" fill="${p.accent2}" />
        <rect x="0" y="480" width="130" height="120" fill="${p.accent1}" />
        <rect x="350" y="560" width="50" height="40" fill="${p.accent3}" />`,
];

// 文本换行
const wrapText = (text: string, maxCharsPerLine: number): string[] => {
    const lines: string[] = [];
    let current = '';

    for (const char of text) {
        if (current.length >= maxCharsPerLine) {
            lines.push(current);
            current = char;
        } else {
            current += char;
        }
    }
    if (current) lines.push(current);
    return lines;
};

// XML转义
const escapeXml = (str: string): string => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

export const generateSVGCard = ({
    word,
    explanation,
    pinyin = '',
    english = '',
    japanese = '',
}: SVGCardOptions): string => {
    const width = 400;
    const height = 600;
    const margin = 20;
    const contentWidth = width - margin * 2;

    const hash = hashWord(word);
    const palette = MONDRIAN_PALETTES[hash % MONDRIAN_PALETTES.length];
    const layout = MONDRIAN_LAYOUTS[hash % MONDRIAN_LAYOUTS.length];

    // 楷体字体栈
    const kaitiFont = `'KaiTi', 'STKaiti', 'Kaiti SC', 'AR PL UKai CN', 'FangSong', serif`;
    const textColor = '#5D5D5D'; // 粉笔灰
    const darkColor = '#3A3A3A';

    // 自动缩放解释文本字号
    const maxCharsPerLine = 16;
    const explanationLines = wrapText(explanation, maxCharsPerLine);
    let explanationFontSize = 20;
    if (explanationLines.length > 6) {
        explanationFontSize = Math.max(16, Math.floor(20 * 6 / explanationLines.length));
    }
    const lineHeight = explanationFontSize * 1.8;

    // 布局Y坐标计算
    const titleY = 60;
    const separatorY = 80;
    const wordY = 140;
    const pinyinY = 175;
    const englishY = 200;
    const japaneseY = 225;
    const explanationStartY = 270;

    // 安全转义所有文本
    const safeWord = escapeXml(word);
    const safePinyin = escapeXml(pinyin);
    const safeEnglish = escapeXml(english);
    const safeJapanese = escapeXml(japanese);

    return `<svg width="400" height="600" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="roundedBg">
      <rect width="${width}" height="${height}" rx="12" />
    </clipPath>
  </defs>

  <g clip-path="url(#roundedBg)">
    <!-- 背景 -->
    <rect width="${width}" height="${height}" fill="${palette.bg}" />

    <!-- 蒙德里安色块 -->
    ${layout(palette)}

    <!-- 半透明内容区域 -->
    <rect x="${margin}" y="${margin}" width="${contentWidth}" height="${height - margin * 2}" rx="8" fill="${palette.bg}" opacity="0.92" />

    <!-- 居中标题 -->
    <text x="${width / 2}" y="${titleY}" font-family="${kaitiFont}" font-size="24" font-weight="bold" fill="${darkColor}" text-anchor="middle">
      ${escapeXml('汉语新解')}
    </text>

    <!-- 分隔线 -->
    <line x1="${margin + 20}" y1="${separatorY}" x2="${width - margin - 20}" y2="${separatorY}" stroke="${textColor}" stroke-width="0.5" opacity="0.4" />

    <!-- 词语 -->
    <text x="${width / 2}" y="${wordY}" font-family="${kaitiFont}" font-size="36" font-weight="bold" fill="${darkColor}" text-anchor="middle">
      ${safeWord}
    </text>

    <!-- 拼音 -->
    ${safePinyin ? `<text x="${width / 2}" y="${pinyinY}" font-family="${kaitiFont}" font-size="16" fill="${textColor}" text-anchor="middle" opacity="0.8">
      ${safePinyin}
    </text>` : ''}

    <!-- 英文 -->
    ${safeEnglish ? `<text x="${width / 2}" y="${englishY}" font-family="Georgia, 'Times New Roman', serif" font-size="14" fill="${textColor}" text-anchor="middle" opacity="0.7" font-style="italic">
      ${safeEnglish}
    </text>` : ''}

    <!-- 日文 -->
    ${safeJapanese ? `<text x="${width / 2}" y="${japaneseY}" font-family="${kaitiFont}" font-size="14" fill="${textColor}" text-anchor="middle" opacity="0.7">
      ${safeJapanese}
    </text>` : ''}

    <!-- 分隔线 -->
    <line x1="${margin + 40}" y1="240" x2="${width - margin - 40}" y2="240" stroke="${textColor}" stroke-width="0.3" opacity="0.3" />

    <!-- 解释文本 -->
    ${explanationLines.map((line, index) => `<text x="${width / 2}" y="${explanationStartY + index * lineHeight}" font-family="${kaitiFont}" font-size="${explanationFontSize}" fill="${darkColor}" text-anchor="middle">
      ${escapeXml(line)}
    </text>`).join('\n    ')}
  </g>
</svg>`.trim();
};
