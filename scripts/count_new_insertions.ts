import { readFileSync } from 'fs';
import { resolve } from 'path';
import { supabase } from '../src/utils/Database/client';

interface ResultEntry {
    coreKeyword: string;
    extendedKeywords: string[];
    platforms: Record<string, string[]>;
}

async function countNewInsertions() {
    const DATE_QUERIED = '2025-11-11';

    // Read result.json
    const resultPath = resolve(process.cwd(), 'data/result.json');
    const resultData: ResultEntry[] = JSON.parse(readFileSync(resultPath, 'utf-8'));

    console.log(`📊 Analyzing ${resultData.length} keywords from result.json...`);
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

    console.log(`Found ${existingAnswers?.length || 0} existing answers in database for ${DATE_QUERIED}`);
    console.log(`🔄 Analyzing new entries...\n`);

    // Create a Set for fast lookup
    const existingSet = new Set(
        (existingAnswers || []).map(a =>
            `${a.core_keyword}|${a.platform}|${a.extended_keyword || 'NULL'}`
        )
    );

    let totalCount = 0;
    let newCount = 0;
    let existingCount = 0;
    let platformCounts: Record<string, { new: number; existing: number }> = {};

    for (const entry of resultData) {
        const { coreKeyword, extendedKeywords, platforms } = entry;

        // Check core keyword answers for each platform
        for (const [platform, answers] of Object.entries(platforms)) {
            if (!platformCounts[platform]) {
                platformCounts[platform] = { new: 0, existing: 0 };
            }

            for (const answer of answers) {
                if (!answer || answer.trim() === '') continue;

                totalCount++;

                // Check if this answer already exists
                const key = `${coreKeyword}|${platform}|NULL`;

                if (existingSet.has(key)) {
                    existingCount++;
                    platformCounts[platform].existing++;
                } else {
                    newCount++;
                    platformCounts[platform].new++;
                }
            }
        }
    }

    console.log('═'.repeat(60));
    console.log('📈 SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total answers in file: ${totalCount}`);
    console.log(`✅ NEW entries to be inserted: ${newCount}`);
    console.log(`⏭️  EXISTING entries (will skip): ${existingCount}`);
    console.log();

    console.log('📊 Breakdown by platform:');
    console.log('─'.repeat(60));
    for (const [platform, counts] of Object.entries(platformCounts)) {
        console.log(`${platform.padEnd(20)} | New: ${String(counts.new).padStart(4)} | Existing: ${String(counts.existing).padStart(4)}`);
    }
    console.log('═'.repeat(60));

    process.exit(0);
}

countNewInsertions().catch(console.error);
