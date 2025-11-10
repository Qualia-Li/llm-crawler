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

/**
 * Cleans unwanted patterns from deepseek answers
 * Patterns to remove:
 * - [\-1], [\2], [\-N], [\N] (brackets with backslash-dash-number or backslash-number)
 * - \- (backslash-dash)
 * - Other similar escape sequences
 */
function cleanAnswer(answer: string): string {
    if (!answer || typeof answer !== 'string') {
        return answer;
    }

    let cleaned = answer;

    // Remove patterns like [\-1], [\2], [\-N], [\N]
    // Matches: [ followed by optional \- or just \, then a digit, then ]
    cleaned = cleaned.replace(/\[\\-?\d+\]/g, '');

    // Remove standalone \- (backslash-dash)
    cleaned = cleaned.replace(/\\-/g, '-');

    // Remove other common escape patterns that might appear
    // Remove \* (escaped asterisks)
    cleaned = cleaned.replace(/\\\*/g, '*');

    // Remove \_ (escaped underscores)
    cleaned = cleaned.replace(/\\_/g, '_');

    // Remove multiple consecutive spaces (that might be left after pattern removal)
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    // Trim any leading/trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
}

async function cleanDeepseekAnswers() {
    const client = await pool.connect();

    try {
        console.log('🔍 Searching for deepseek answers...\n');

        // Get all deepseek answers
        const selectQuery = `
            SELECT id, answer, core_keyword, extended_keyword, platform
            FROM answers
            WHERE platform = 'deepseek'
            ORDER BY id
        `;

        const result = await client.query(selectQuery);
        const answers = result.rows;

        console.log(`Found ${answers.length} deepseek answers\n`);

        if (answers.length === 0) {
            console.log('No deepseek answers to clean. Exiting.');
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

            const cleanedAnswer = cleanAnswer(answer);

            if (cleanedAnswer !== answer) {
                try {
                    await client.query(
                        'UPDATE answers SET answer = $1 WHERE id = $2',
                        [cleanedAnswer, id]
                    );
                    updatedCount++;

                    // Show sample of what was changed
                    if (updatedCount <= 5) {
                        console.log(`\n[${i + 1}/${answers.length}] Updated (ID: ${id})`);
                        console.log(`Keyword: ${keyword}`);
                        console.log(`Before (first 100 chars): ${answer.substring(0, 100)}...`);
                        console.log(`After (first 100 chars): ${cleanedAnswer.substring(0, 100)}...`);
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
        await pool.end();
    }
}

// Run the cleanup
cleanDeepseekAnswers().catch(console.error);
