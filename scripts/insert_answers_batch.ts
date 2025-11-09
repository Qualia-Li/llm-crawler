import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create connection pool using the same config as your project
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

async function insertAnswers() {
    const client = await pool.connect();

    try {
        // Read result.json
        console.log('Reading result.json...');
        const data = JSON.parse(fs.readFileSync('./data/result.json', 'utf8'));
        console.log(`Found ${data.length} core keywords\n`);

        let totalInserted = 0;
        let totalSkipped = 0;
        let errors = 0;

        // Start transaction
        await client.query('BEGIN');

        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            const { coreKeyword, extendedKeywords = [], platforms = {} } = entry;

            console.log(`\n[${i + 1}/${data.length}] Processing: ${coreKeyword}`);

            // Look up keyword_id
            const keywordQuery = await client.query(
                'SELECT id FROM keywords WHERE core_keyword = $1',
                [coreKeyword]
            );

            let keywordId = null;
            if (keywordQuery.rows.length > 0) {
                keywordId = keywordQuery.rows[0].id;
                console.log(`  ✓ Found keyword_id: ${keywordId}`);
            } else {
                console.log(`  ⚠️  No keyword_id found, skipping...`);
                totalSkipped += Object.keys(platforms).reduce((sum, p) => sum + (platforms[p]?.length || 0), 0);
                continue;
            }

            // Process each platform
            for (const [platform, answers] of Object.entries(platforms)) {
                if (!Array.isArray(answers) || answers.length === 0) {
                    continue;
                }

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
                            [keywordId, platform, coreKeyword]
                        );

                        if (existsQuery.rows.length === 0) {
                            await client.query(
                                `INSERT INTO answers
                                 (keyword_id, core_keyword, extended_keyword, platform, answer)
                                 VALUES ($1, $2, NULL, $3, $4)`,
                                [keywordId, coreKeyword, platform, coreAnswer]
                            );
                            platformInserted++;
                        } else {
                            platformSkipped++;
                        }
                    } catch (err: any) {
                        console.error(`    ❌ Error: ${err.message}`);
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
                            [keywordId, platform, coreKeyword, extendedKeyword]
                        );

                        if (existsQuery.rows.length === 0) {
                            await client.query(
                                `INSERT INTO answers
                                 (keyword_id, core_keyword, extended_keyword, platform, answer)
                                 VALUES ($1, $2, $3, $4, $5)`,
                                [keywordId, coreKeyword, extendedKeyword, platform, answer]
                            );
                            platformInserted++;
                        } else {
                            platformSkipped++;
                        }
                    } catch (err: any) {
                        console.error(`    ❌ Error for "${extendedKeyword}": ${err.message}`);
                        errors++;
                    }
                }

                totalInserted += platformInserted;
                totalSkipped += platformSkipped;
                console.log(`    ${platform}: +${platformInserted} (${platformSkipped} duplicates)`);
            }
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('\n' + '='.repeat(80));
        console.log('✅ Import completed!');
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

// Run the import
insertAnswers().catch(console.error);
