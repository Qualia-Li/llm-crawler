import 'dotenv/config';
import { loadKeywordsToQuery, buildTaskQueue, getQueueStatus } from '../src/utils/Database/loader';

async function main() {
    console.log('📊 Loading queue from database...\n');

    const keywords = await loadKeywordsToQuery();
    console.log(`Found ${keywords.length} core keywords to query today\n`);

    const taskQueues = await buildTaskQueue(keywords);
    const status = getQueueStatus(taskQueues);

    console.log('📋 Queue Status Report');
    console.log('='.repeat(80));

    let totalPending = 0;
    for (const { platform, count } of status) {
        totalPending += count;
        const icon = count === 0 ? '✓' : '⚠️';
        console.log(`${platform.padEnd(15)} : ${count} questions pending ${icon}`);
    }

    console.log('='.repeat(80));
    console.log(`Total Pending: ${totalPending} questions\n`);

    // Show some example pending questions
    if (totalPending > 0) {
        console.log('\n📝 Example Pending Questions:');
        let shown = 0;
        for (const [platform, tasks] of Object.entries(taskQueues)) {
            if (shown >= 5) break;
            for (const task of tasks) {
                if (shown >= 5) break;
                const keyword = task.extendedKeyword || task.coreKeyword;
                console.log(`  - [${platform}] ${keyword}`);
                shown++;
            }
        }
    }

    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
