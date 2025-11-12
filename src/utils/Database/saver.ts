import { supabase } from './client';
import { Engines } from '@/src/engines/engines';

export interface AnswerData {
    keywordId: string;
    coreKeyword: string;
    extendedKeyword: string | null;
    platform: Engines;
    answer: string;
    dateQueried: string; // Format: YYYY-MM-DD
    answerFormat?: 'html' | 'md';
}

/**
 * Save an answer to the database
 */
export async function saveAnswer(data: AnswerData): Promise<boolean> {
    const {
        keywordId,
        coreKeyword,
        extendedKeyword,
        platform,
        answer,
        dateQueried,
        answerFormat = 'html'
    } = data;

    try {
        const { error } = await supabase
            .from('answers')
            .insert({
                keyword_id: keywordId,
                core_keyword: coreKeyword,
                extended_keyword: extendedKeyword,
                platform,
                answer,
                date_queried: dateQueried,
                answer_format: answerFormat,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error(`Error saving answer for ${coreKeyword} (${extendedKeyword || 'core'}) on ${platform}:`, error);
            return false;
        }

        console.log(`✓ Saved answer: ${platform} - ${coreKeyword}${extendedKeyword ? ` / ${extendedKeyword}` : ''}`);
        return true;
    } catch (err) {
        console.error('Exception saving answer:', err);
        return false;
    }
}

/**
 * Update the next_queried date for a keyword after completing all platforms
 */
export async function updateNextQueryDate(keywordId: string, intervalDays: number): Promise<boolean> {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const nextQueried = nextDate.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        const { error } = await supabase
            .from('keywords')
            .update({
                next_queried: nextQueried,
                updated_at: new Date().toISOString()
            })
            .eq('id', keywordId);

        if (error) {
            console.error(`Error updating next_queried for keyword ${keywordId}:`, error);
            return false;
        }

        console.log(`✓ Updated next_queried to ${nextQueried} for keyword ${keywordId}`);
        return true;
    } catch (err) {
        console.error('Exception updating next_queried:', err);
        return false;
    }
}

/**
 * Check if an answer already exists
 */
export async function answerExists(
    keywordId: string,
    platform: Engines,
    extendedKeyword: string | null,
    dateQueried: string
): Promise<boolean> {
    try {
        let query = supabase
            .from('answers')
            .select('id', { count: 'exact', head: true })
            .eq('keyword_id', keywordId)
            .eq('platform', platform)
            .eq('date_queried', dateQueried);

        if (extendedKeyword) {
            query = query.eq('extended_keyword', extendedKeyword);
        } else {
            query = query.is('extended_keyword', null);
        }

        const { count, error } = await query;

        if (error) {
            console.error('Error checking answer existence:', error);
            return false;
        }

        return (count ?? 0) > 0;
    } catch (err) {
        console.error('Exception checking answer existence:', err);
        return false;
    }
}
