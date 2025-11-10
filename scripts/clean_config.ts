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
                pattern: /\s{2,}/g,
                replacement: ' ',
                description: 'Replace multiple spaces with single space'
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
                pattern: /([^\n*])\*\s+/g,
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
