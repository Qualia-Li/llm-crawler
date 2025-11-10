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

async function sampleAnswers() {
    const platform = process.argv[2] || '豆包';
    const limit = parseInt(process.argv[3] || '5', 10);

    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT id, core_keyword, extended_keyword, answer
            FROM answers
            WHERE platform = $1
            ORDER BY id
            LIMIT $2
        `, [platform, limit]);

        console.log(`\nSampling ${result.rows.length} answers from ${platform}:\n`);
        console.log('='.repeat(80));

        result.rows.forEach((row, idx) => {
            const keyword = row.extended_keyword || row.core_keyword;
            console.log(`\n[${idx + 1}] ID: ${row.id} | Keyword: ${keyword}`);
            console.log('-'.repeat(80));
            console.log(row.answer.substring(0, 500));
            console.log('...\n');
        });
    } finally {
        client.release();
        await pool.end();
    }
}

sampleAnswers().catch(console.error);
