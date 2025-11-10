import { Pool } from 'pg';
import dotenv from 'dotenv';
import { cleanAnswerForPlatform, getConfiguredPlatforms, cleanConfig } from './clean_config.js';

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

async function cleanAnswersForPlatform(platform: string) {
    const client = await pool.connect();

    try {
        console.log(`🔍 Searching for ${platform} answers...\n`);

        // Show which rules will be applied
        const platformConfig = cleanConfig.find(c => c.platform === platform);
        if (platformConfig) {
            console.log(`Rules to apply for ${platform}:`);
            platformConfig.rules.forEach((rule, idx) => {
                console.log(`  ${idx + 1}. ${rule.description}`);
            });
            console.log();
        }

        // Get all answers for this platform
        const selectQuery = `
            SELECT id, answer, core_keyword, extended_keyword, platform
            FROM answers
            WHERE platform = $1
            ORDER BY id
        `;

        const result = await client.query(selectQuery, [platform]);
        const answers = result.rows;

        console.log(`Found ${answers.length} ${platform} answers\n`);

        if (answers.length === 0) {
            console.log(`No ${platform} answers to clean. Exiting.`);
            return;
        }

        let updatedCount = 0;
        let unchangedCount = 0;
        let errors = 0;

        // Start transaction
        await client.query('BEGIN');

        for (let i = 0; i < answers.length; i++) {
            const row = answers[i];
            const { id, answer, core_keyword, extended_keyword } = row;
            const keyword = extended_keyword || core_keyword;

            const cleanedAnswer = cleanAnswerForPlatform(answer, platform);

            if (cleanedAnswer !== answer) {
                try {
                    await client.query(
                        'UPDATE answers SET answer = $1 WHERE id = $2',
                        [cleanedAnswer, id]
                    );
                    updatedCount++;

                    // Show sample of what was changed
                    if (updatedCount <= 3) {
                        console.log(`\n[${i + 1}/${answers.length}] Updated (ID: ${id})`);
                        console.log(`Keyword: ${keyword}`);
                        console.log(`Before (first 150 chars):\n  ${answer.substring(0, 150).replace(/\n/g, '\\n')}...`);
                        console.log(`After (first 150 chars):\n  ${cleanedAnswer.substring(0, 150).replace(/\n/g, '\\n')}...`);
                    } else if (updatedCount % 10 === 0) {
                        console.log(`  ✓ Updated ${updatedCount} records so far...`);
                    }
                } catch (err: any) {
                    console.error(`❌ Error updating ID ${id}: ${err.message}`);
                    errors++;
                }
            } else {
                unchangedCount++;
            }
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('\n' + '='.repeat(80));
        console.log('✅ Cleanup completed!');
        console.log(`   Platform: ${platform}`);
        console.log(`   Total records: ${answers.length}`);
        console.log(`   Updated: ${updatedCount}`);
        console.log(`   Unchanged: ${unchangedCount}`);
        console.log(`   Errors: ${errors}`);
        console.log('='.repeat(80));

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Fatal error:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function cleanAllPlatforms() {
    try {
        const platforms = getConfiguredPlatforms();
        console.log(`\n${'='.repeat(80)}`);
        console.log('🧹 Starting cleanup for all configured platforms');
        console.log(`Platforms: ${platforms.join(', ')}`);
        console.log('='.repeat(80) + '\n');

        for (const platform of platforms) {
            await cleanAnswersForPlatform(platform);
            console.log('\n');
        }

        console.log('✅ All platforms cleaned successfully!');
    } finally {
        await pool.end();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const platform = args[0];

if (platform) {
    // Clean specific platform
    const configuredPlatforms = getConfiguredPlatforms();
    if (!configuredPlatforms.includes(platform)) {
        console.error(`❌ Unknown platform: ${platform}`);
        console.error(`Available platforms: ${configuredPlatforms.join(', ')}`);
        process.exit(1);
    }
    cleanAnswersForPlatform(platform)
        .then(() => pool.end())
        .catch(console.error);
} else {
    // Clean all platforms
    cleanAllPlatforms().catch(console.error);
}
