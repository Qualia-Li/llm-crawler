import { readFileSync } from 'fs';
import { resolve } from 'path';
import { supabase } from '../src/utils/Database/client';
import { randomUUID } from 'crypto';

interface ResultEntry {
    coreKeyword: string;
    extendedKeywords: string[];
    platforms: Record<string, string[]>;
}

async function insertFromResult() {
    const DATE_QUERIED = '2025-11-11';

    // Read result.json
    const resultPath = resolve(process.cwd(), 'data/result.json');
    const resultData: ResultEntry[] = JSON.parse(readFileSync(resultPath, 'utf-8'));

    console.log(`📊 Processing ${resultData.length} keywords from result.json...`);
    console.log(`📅 Date queried: ${DATE_QUERIED}`);
    console.log(`⏳ Fetching existing answers from database...\n`);

    // Fetch all existing answers for the target date at once
    const { data: existingAnswers, error } = await supabase
        .from('answers')
        .select('core_keyword, platform, extended_keyword')
        .eq('date_queried', DATE_QUERIED);

    if (error) {
        console.error('Error fetching existing answers:', error);
        process.exit(1);
    }

    console.log(`Found ${existingAnswers?.length || 0} existing answers in database for ${DATE_QUERIED}\n`);

    // Create a Set for fast lookup
    const existingSet = new Set(
        (existingAnswers || []).map(a =>
            `${a.core_keyword}|${a.platform}|${a.extended_keyword || 'NULL'}`
        )
    );

    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let platformCounts: Record<string, { inserted: number; skipped: number; errors: number }> = {};

    const now = new Date().toISOString();

    for (const entry of resultData) {
        const { coreKeyword, extendedKeywords, platforms } = entry;

        // Try to find existing keyword (skip if not found - legacy data doesn't need keyword creation)
        const { data: existingKeyword } = await supabase
            .from('keywords')
            .select('id')
            .eq('core_keyword', coreKeyword)
            .single();

        if (!existingKeyword) {
            console.log(`⏭️  Skipping "${coreKeyword}" - keyword not found in database`);
            continue;
        }

        const keywordId = existingKeyword.id;

        // Insert answers for each platform
        for (const [platform, answers] of Object.entries(platforms)) {
            if (!platformCounts[platform]) {
                platformCounts[platform] = { inserted: 0, skipped: 0, errors: 0 };
            }

            // answers[0] = core keyword answer
            // answers[1...n] = extended keyword answers
            for (let i = 0; i < answers.length; i++) {
                const answer = answers[i];
                if (!answer || answer.trim() === '') {
                    continue;
                }

                // Determine which keyword this answer is for
                const isCore = i === 0;
                const extendedKeyword = isCore ? null : extendedKeywords[i - 1];

                const key = `${coreKeyword}|${platform}|${extendedKeyword || 'NULL'}`;

                if (existingSet.has(key)) {
                    skippedCount++;
                    platformCounts[platform].skipped++;
                    continue;
                }

                // Insert the answer
                const { error: insertError } = await supabase
                    .from('answers')
                    .insert({
                        keyword_id: keywordId,
                        core_keyword: coreKeyword,
                        extended_keyword: extendedKeyword,
                        platform,
                        answer,
                        date_queried: DATE_QUERIED,
                        answer_format: 'html',
                        created_at: now,
                        updated_at: now
                    });

                if (insertError) {
                    // Skip duplicate errors as they're expected
                    if (!insertError.message.includes('duplicate key')) {
                        console.error(`❌ Error inserting ${platform} answer for "${coreKeyword}" / "${extendedKeyword || 'core'}":`, insertError.message);
                    }
                    errorCount++;
                    platformCounts[platform].errors++;
                } else {
                    insertedCount++;
                    platformCounts[platform].inserted++;
                    if (insertedCount % 100 === 0) {
                        console.log(`📝 Progress: ${insertedCount} inserted, ${skippedCount} skipped, ${errorCount} errors`);
                    }
                }
            }
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📈 INSERTION COMPLETE');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully inserted: ${insertedCount}`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log();

    console.log('📊 Breakdown by platform:');
    console.log('─'.repeat(60));
    for (const [platform, counts] of Object.entries(platformCounts)) {
        console.log(`${platform.padEnd(20)} | Inserted: ${String(counts.inserted).padStart(4)} | Skipped: ${String(counts.skipped).padStart(4)} | Errors: ${String(counts.errors).padStart(4)}`);
    }
    console.log('═'.repeat(60));

    process.exit(0);
}

insertFromResult().catch(console.error);
