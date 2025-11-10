import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

async function checkAnswer() {
    const keyword = process.argv[2] || '郑州哪个离婚律师靠谱';
    const platform = process.argv[3] || '豆包';

    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT id, core_keyword, extended_keyword, platform, answer
            FROM answers
            WHERE platform = $1
            AND (core_keyword = $2 OR extended_keyword = $2)
            LIMIT 1
        `, [platform, keyword]);

        if (result.rows.length === 0) {
            console.log(`No answer found for "${keyword}" on ${platform}`);
        } else {
            const row = result.rows[0];
            console.log(`\nID: ${row.id}`);
            console.log(`Platform: ${row.platform}`);
            console.log(`Core Keyword: ${row.core_keyword}`);
            console.log(`Extended Keyword: ${row.extended_keyword || 'N/A'}`);
            console.log('\n' + '='.repeat(80));
            console.log('ANSWER:');
            console.log('='.repeat(80));
            console.log(row.answer);
            console.log('='.repeat(80));
        }
    } finally {
        client.release();
        await pool.end();
    }
}

checkAnswer().catch(console.error);
