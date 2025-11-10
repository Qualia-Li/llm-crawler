/**
 * Configuration for cleaning AI answer patterns
 * Each platform can have its own set of regex replacements
 */

export interface CleanRule {
    pattern: RegExp;
    replacement: string;
    description: string;
}

export interface PlatformCleanConfig {
    platform: string;
    rules: CleanRule[];
}

export const cleanConfig: PlatformCleanConfig[] = [
    {
        platform: 'deepseek',
        rules: [
            {
                pattern: /\[\\-?\d+\]/g,
                replacement: '',
                description: 'Remove patterns like [\\-1], [\\2], [\\-N], [\\N]'
            },
            {
                pattern: /\\-/g,
                replacement: '-',
                description: 'Replace \\- with -'
            },
            {
                pattern: /\\\*/g,
                replacement: '*',
                description: 'Replace \\* with *'
            },
            {
                pattern: /\\_/g,
                replacement: '_',
                description: 'Replace \\_ with _'
            },
            {
                pattern: /：\s+\*\s+\*\*/g,
                replacement: '：\n  * **',
                description: 'Add newline and indentation for nested bullets after colon (： * **)'
            },
            {
                pattern: /([^\n])\s\*\s+(?!\*)/g,
                replacement: '$1\n * ',
                description: 'Add newline before bullets (but not if already indented or part of bold)'
            },
            {
                pattern: /(###[^\n]+[^ \n])\s+/g,
                replacement: '$1\n',
                description: 'Add newline after ### headings'
            },
            {
                pattern: /\n{3,}/g,
                replacement: '\n\n',
                description: 'Replace 3+ newlines with double newline'
            }
        ]
    },
    {
        platform: '文心一言',
        rules: [
            {
                pattern: /\n\*\n\*/g,
                replacement: '**',
                description: 'Fix incorrectly split markdown bold (\\n*\\n* → **)'
            },
            {
                pattern: /([^\n*])\*\s+/g,
                replacement: '$1\n* ',
                description: 'Add newline before * (for bullet points, not markdown bold)'
            },
            {
                pattern: /\n{3,}/g,
                replacement: '\n\n',
                description: 'Replace multiple newlines with double newline'
            }
        ]
    },
    {
        platform: '豆包',
        rules: [
            {
                pattern: /!\[.*?\]\(https?:\/\/[^\)]+\)/g,
                replacement: '',
                description: 'Remove image markdown: ![...](https://...)'
            },
            {
                pattern: /([；;])\s*\*\s+/g,
                replacement: '$1\n* ',
                description: 'Add newline before * after semicolons (；* or ; *)'
            },
            {
                pattern: /([^\n*；;])\*\s+/g,
                replacement: '$1\n* ',
                description: 'Add newline before * (for bullet points)'
            },
            {
                pattern: /\\\./g,
                replacement: '.',
                description: 'Replace \\. with .'
            },
            {
                pattern: /\n{3,}/g,
                replacement: '\n\n',
                description: 'Replace multiple newlines with double newline'
            }
        ]
    },
    {
        platform: '夸克',
        rules: [
            {
                pattern: /检索到\d+篇搜索来源[\s\S]*?!\[收起\]\(https:\/\/cdn\.sm\.cn\/static\/25\/02\/17\/[a-f0-9]+\.png\)/g,
                replacement: '',
                description: 'Remove search metadata block (from "检索到XX篇搜索来源..." to "![收起]" image)'
            },
            {
                pattern: /\n{3,}/g,
                replacement: '\n\n',
                description: 'Replace multiple newlines with double newline'
            }
        ]
    },
    {
        platform: '元宝',
        rules: [
            {
                pattern: /\u200b/g,
                replacement: '',
                description: 'Remove zero-width space characters (U+200B)'
            },
            {
                pattern: /(\d+)\.\s+\1\./g,
                replacement: '$1.',
                description: 'Remove double numbering (1.  1. → 1.)'
            },
            {
                pattern: /\*\s+•\s+/g,
                replacement: '* ',
                description: 'Remove bullet dots (* • → *)'
            },
            {
                pattern: /^(\s*)(\d+)\.\s+$/gm,
                replacement: '$1$2. ',
                description: 'Fix empty numbered lists'
            },
            {
                pattern: /\n{3,}/g,
                replacement: '\n\n',
                description: 'Replace multiple newlines with double newline'
            }
        ]
    }
];

/**
 * Apply all cleaning rules for a specific platform
 */
export function cleanAnswerForPlatform(answer: string, platform: string): string {
    if (!answer || typeof answer !== 'string') {
        return answer;
    }

    const platformConfig = cleanConfig.find(c => c.platform === platform);
    if (!platformConfig) {
        return answer;
    }

    let cleaned = answer;

    // Apply each rule in order
    for (const rule of platformConfig.rules) {
        cleaned = cleaned.replace(rule.pattern, rule.replacement);
    }

    // Always trim at the end
    cleaned = cleaned.trim();

    return cleaned;
}

/**
 * Get all configured platforms
 */
export function getConfiguredPlatforms(): string[] {
    return cleanConfig.map(c => c.platform);
}
