import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create connection pool
let pool: Pool;

if (process.env.DB_HOST) {
    pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
} else if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    pool = new Pool({
        host: url.hostname,
        port: parseInt(url.port || '5432', 10),
        database: url.pathname.slice(1),
        user: url.username,
        password: url.password,
        ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
            rejectUnauthorized: false
        } : false
    });
}

async function reinsertDeepseek() {
    const client = await pool.connect();

    try {
        // Step 1: Check existing deepseek records
        console.log('Step 1: Checking existing deepseek records...');
        const countResult = await client.query(
            'SELECT COUNT(*) FROM answers WHERE platform = $1',
            ['deepseek']
        );
        const existingCount = parseInt(countResult.rows[0].count, 10);
        console.log(`  Found ${existingCount} existing deepseek records\n`);

        if (existingCount > 0) {
            console.log('Step 2: Deleting existing deepseek records...');
            await client.query('BEGIN');
            const deleteResult = await client.query(
                'DELETE FROM answers WHERE platform = $1',
                ['deepseek']
            );
            await client.query('COMMIT');
            console.log(`  ✓ Deleted ${deleteResult.rowCount} deepseek records\n`);
        }

        // Step 3: Read result.json
        console.log('Step 3: Reading result.json...');
        const data = JSON.parse(fs.readFileSync('./data/result.json', 'utf8'));
        console.log(`  Found ${data.length} core keywords\n`);

        let totalInserted = 0;
        let totalSkipped = 0;
        let errors = 0;

        // Step 4: Insert deepseek answers
        console.log('Step 4: Inserting deepseek answers...\n');
        await client.query('BEGIN');

        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            const { coreKeyword, extendedKeywords = [], platforms = {} } = entry;

            // Only process deepseek platform
            if (!platforms.deepseek || !Array.isArray(platforms.deepseek)) {
                continue;
            }

            console.log(`[${i + 1}/${data.length}] Processing: ${coreKeyword}`);

            // Look up keyword_id
            const keywordQuery = await client.query(
                'SELECT id FROM keywords WHERE core_keyword = $1',
                [coreKeyword]
            );

            let keywordId = null;
            if (keywordQuery.rows.length > 0) {
                keywordId = keywordQuery.rows[0].id;
            } else {
                console.log(`  ⚠️  No keyword_id found, skipping...`);
                totalSkipped += platforms.deepseek.length;
                continue;
            }

            const answers = platforms.deepseek;
            let platformInserted = 0;
            let platformSkipped = 0;

            // First answer is for the core keyword
            const coreAnswer = answers[0];
            if (coreAnswer && coreAnswer.trim() !== '') {
                try {
                    const existsQuery = await client.query(
                        `SELECT id FROM answers
                         WHERE keyword_id = $1 AND platform = $2
                         AND core_keyword = $3 AND extended_keyword IS NULL`,
                        [keywordId, 'deepseek', coreKeyword]
                    );

                    if (existsQuery.rows.length === 0) {
                        await client.query(
                            `INSERT INTO answers
                             (keyword_id, core_keyword, extended_keyword, platform, answer)
                             VALUES ($1, $2, NULL, $3, $4)`,
                            [keywordId, coreKeyword, 'deepseek', coreAnswer]
                        );
                        platformInserted++;
                    } else {
                        platformSkipped++;
                    }
                } catch (err: any) {
                    console.error(`  ❌ Error: ${err.message}`);
                    errors++;
                }
            }

            // Extended keywords
            for (let j = 0; j < extendedKeywords.length && j + 1 < answers.length; j++) {
                const extendedKeyword = extendedKeywords[j];
                const answer = answers[j + 1];

                if (!answer || answer.trim() === '') {
                    continue;
                }

                try {
                    const existsQuery = await client.query(
                        `SELECT id FROM answers
                         WHERE keyword_id = $1 AND platform = $2
                         AND core_keyword = $3 AND extended_keyword = $4`,
                        [keywordId, 'deepseek', coreKeyword, extendedKeyword]
                    );

                    if (existsQuery.rows.length === 0) {
                        await client.query(
                            `INSERT INTO answers
                             (keyword_id, core_keyword, extended_keyword, platform, answer)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [keywordId, coreKeyword, extendedKeyword, 'deepseek', answer]
                        );
                        platformInserted++;
                    } else {
                        platformSkipped++;
                    }
                } catch (err: any) {
                    console.error(`  ❌ Error for "${extendedKeyword}": ${err.message}`);
                    errors++;
                }
            }

            totalInserted += platformInserted;
            totalSkipped += platformSkipped;
            console.log(`  deepseek: +${platformInserted} (${platformSkipped} duplicates)`);
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('\n' + '='.repeat(80));
        console.log('✅ Reinsertion completed!');
        console.log(`   Deleted: ${existingCount}`);
        console.log(`   Inserted: ${totalInserted}`);
        console.log(`   Skipped: ${totalSkipped}`);
        console.log(`   Errors: ${errors}`);
        console.log('='.repeat(80));

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Fatal error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the reinsertion
reinsertDeepseek().catch(console.error);
