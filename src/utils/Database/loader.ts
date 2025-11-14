import { supabase } from './client';
import { Engines } from '@/src/engines/engines';
import { readFile } from 'fs/promises';

export interface KeywordTask {
    keywordId: string;
    coreKeyword: string;
    extendedKeywords: string[];
    platforms: Engines[];
    dateQueried: string; // Format: YYYY-MM-DD
}

export interface CustomKeywordConfig {
    coreKeyword: string;
    platforms: Engines[];
    extendedKeywords: string[];
}

export interface TaskQueue {
    [platform: string]: {
        keywordId: string;
        coreKeyword: string;
        extendedKeyword: string | null;
        dateQueried: string;
    }[];
}

export interface CompletedQuestion {
    keywordId: string;
    coreKeyword: string;
    extendedKeyword: string | null;
    platform: string;
    dateQueried: string;
}

// Platforms to skip
const SKIP_PLATFORMS = ['ChatGPT', 'Google AI Overview', 'Perplexity'];

// Platform name mapping: keywords table -> answers table
const PLATFORM_NAME_MAP: Record<string, string> = {
    '文心': '文心一言'
};

function normalizePlatformName(platform: string): string {
    return PLATFORM_NAME_MAP[platform] || platform;
}

/**
 * Load keywords from a custom config file
 * @param configPath Path to JSON config file
 * @param targetDate Target date for queries (YYYY-MM-DD format)
 */
export async function loadCustomKeywords(configPath: string, targetDate: string): Promise<KeywordTask[]> {
    try {
        const configContent = await readFile(configPath, 'utf-8');
        const customConfigs: CustomKeywordConfig[] = JSON.parse(configContent);

        const tasks: KeywordTask[] = [];

        // Get the default client_id from existing keywords
        const { data: existingKeywordData } = await supabase
            .from('keywords')
            .select('client_id')
            .limit(1)
            .single();

        if (!existingKeywordData) {
            console.error('No existing keywords found. Cannot determine client_id.');
            return [];
        }

        const clientId = existingKeywordData.client_id;

        for (const config of customConfigs) {
            // Try to find existing keyword in database
            const { data: existingKeyword } = await supabase
                .from('keywords')
                .select('id')
                .eq('core_keyword', config.coreKeyword)
                .single();

            let keywordId: string;

            if (existingKeyword) {
                keywordId = existingKeyword.id;
            } else {
                // Create new keyword entry
                const { data: newKeyword, error } = await supabase
                    .from('keywords')
                    .insert({
                        core_keyword: config.coreKeyword,
                        extended_keywords: config.extendedKeywords,
                        platforms: config.platforms,
                        next_queried: targetDate,
                        client_id: clientId,
                        interval_days: 1
                    })
                    .select('id')
                    .single();

                if (error || !newKeyword) {
                    console.error(`Error creating keyword ${config.coreKeyword}:`, error);
                    continue;
                }

                keywordId = newKeyword.id;
            }

            // Normalize platform names and filter
            const normalizedPlatforms = config.platforms
                .filter(p => !SKIP_PLATFORMS.includes(p))
                .map(p => normalizePlatformName(p) as Engines);

            tasks.push({
                keywordId,
                coreKeyword: config.coreKeyword,
                extendedKeywords: config.extendedKeywords,
                platforms: normalizedPlatforms,
                dateQueried: targetDate
            });
        }

        return tasks;
    } catch (error) {
        console.error('Error loading custom keywords config:', error);
        return [];
    }
}

/**
 * Load keywords that need to be queried today
 * @param targetDate Optional date to query for (YYYY-MM-DD format). Defaults to today in local timezone.
 */
export async function loadKeywordsToQuery(targetDate?: string): Promise<KeywordTask[]> {
    // Use local date to avoid timezone issues
    const today = targetDate || new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

    // Get keywords where next_queried is today or earlier
    const { data: keywords, error } = await supabase
        .from('keywords')
        .select('id, core_keyword, extended_keywords, platforms, next_queried')
        .lte('next_queried', today);

    if (error) {
        console.error('Error loading keywords:', error);
        return [];
    }

    if (!keywords || keywords.length === 0) {
        console.log('No keywords need to be queried today');
        return [];
    }

    return keywords.map(k => ({
        keywordId: k.id,
        coreKeyword: k.core_keyword,
        extendedKeywords: k.extended_keywords || [],
        // Filter out platforms we want to skip and normalize names
        platforms: (k.platforms as Engines[])
            .filter(p => !SKIP_PLATFORMS.includes(p))
            .map(p => normalizePlatformName(p) as Engines),
        dateQueried: today
    }));
}

/**
 * Build task queue by checking which answers are missing
 */
export async function buildTaskQueue(keywords: KeywordTask[]): Promise<TaskQueue> {
    const queue: TaskQueue = {};

    for (const keyword of keywords) {
        const { keywordId, coreKeyword, extendedKeywords, platforms, dateQueried } = keyword;

        // Get existing answers for this keyword and date
        const { data: existingAnswers, error } = await supabase
            .from('answers')
            .select('platform, extended_keyword')
            .eq('keyword_id', keywordId)
            .eq('date_queried', dateQueried);

        if (error) {
            console.error(`Error checking answers for ${coreKeyword}:`, error);
            continue;
        }

        // Create a set of completed tasks for quick lookup
        const completed = new Set<string>();
        if (existingAnswers) {
            for (const answer of existingAnswers) {
                const key = `${answer.platform}:${answer.extended_keyword || 'CORE'}`;
                completed.add(key);
            }
        }

        // Check each platform
        for (const platform of platforms) {
            if (!queue[platform]) {
                queue[platform] = [];
            }

            // Check core keyword
            if (!completed.has(`${platform}:CORE`)) {
                queue[platform].push({
                    keywordId,
                    coreKeyword,
                    extendedKeyword: null,
                    dateQueried
                });
            }

            // Check extended keywords
            for (const extendedKeyword of extendedKeywords) {
                if (!completed.has(`${platform}:${extendedKeyword}`)) {
                    queue[platform].push({
                        keywordId,
                        coreKeyword,
                        extendedKeyword,
                        dateQueried
                    });
                }
            }
        }
    }

    return queue;
}

/**
 * Get queue status for display
 */
export function getQueueStatus(queue: TaskQueue): { platform: string; count: number }[] {
    return Object.entries(queue).map(([platform, tasks]) => ({
        platform,
        count: tasks.length
    }));
}

/**
 * Get completed questions for a specific date
 */
export async function getCompletedQuestions(keywords: KeywordTask[]): Promise<CompletedQuestion[]> {
    const completed: CompletedQuestion[] = [];

    for (const keyword of keywords) {
        const { keywordId, coreKeyword, platforms, dateQueried } = keyword;

        // Get existing answers for this keyword and date
        const { data: existingAnswers, error } = await supabase
            .from('answers')
            .select('platform, extended_keyword')
            .eq('keyword_id', keywordId)
            .eq('date_queried', dateQueried);

        if (error || !existingAnswers) continue;

        for (const answer of existingAnswers) {
            // Normalize platform name
            const normalizedPlatform = normalizePlatformName(answer.platform);

            // Only include if platform is in the keyword's platform list
            if (platforms.includes(normalizedPlatform as any)) {
                completed.push({
                    keywordId,
                    coreKeyword,
                    extendedKeyword: answer.extended_keyword,
                    platform: normalizedPlatform,
                    dateQueried
                });
            }
        }
    }

    return completed;
}

/**
 * Get summary statistics for keywords and answers
 */
export interface QueueSummary {
    targetDate: string;
    totalKeywords: number;
    totalQuestions: number; // total questions across all platforms (core + extended)
    completedQuestions: number;
    pendingQuestions: number;
    platformStats: {
        platform: string;
        completed: number;
        pending: number;
        total: number;
    }[];
}

export async function getQueueSummary(keywords: KeywordTask[], queue: TaskQueue): Promise<QueueSummary> {
    const completed = await getCompletedQuestions(keywords);

    // Calculate total questions (core + extended for each platform)
    let totalQuestions = 0;
    const platformSet = new Set<string>();

    for (const keyword of keywords) {
        for (const platform of keyword.platforms) {
            platformSet.add(platform);
            // 1 core + extended keywords
            totalQuestions += 1 + keyword.extendedKeywords.length;
        }
    }

    // Calculate platform stats
    const platformStats: QueueSummary['platformStats'] = [];
    for (const platform of Array.from(platformSet).sort()) {
        const platformCompleted = completed.filter(c => c.platform === platform).length;
        const platformPending = queue[platform]?.length || 0;
        const platformTotal = platformCompleted + platformPending;

        platformStats.push({
            platform,
            completed: platformCompleted,
            pending: platformPending,
            total: platformTotal
        });
    }

    return {
        targetDate: keywords[0]?.dateQueried || '',
        totalKeywords: keywords.length,
        totalQuestions,
        completedQuestions: completed.length,
        pendingQuestions: platformStats.reduce((sum, s) => sum + s.pending, 0),
        platformStats
    };
}
