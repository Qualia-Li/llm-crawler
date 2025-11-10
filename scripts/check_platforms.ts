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

async function checkPlatforms() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT platform, COUNT(*) as count
            FROM answers
            GROUP BY platform
            ORDER BY platform
        `);

        console.log('Platforms in database:');
        console.log('='.repeat(40));
        result.rows.forEach(row => {
            console.log(`  ${row.platform}: ${row.count} answers`);
        });
        console.log('='.repeat(40));
    } finally {
        client.release();
        await pool.end();
    }
}

checkPlatforms().catch(console.error);
