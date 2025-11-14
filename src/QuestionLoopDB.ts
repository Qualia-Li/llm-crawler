import { engines, Engines, initializeEngines } from "@/src/engines/engines";
import { loadKeywordsToQuery, buildTaskQueue, getQueueStatus, TaskQueue } from "@/src/utils/Database/loader";
import { saveAnswer, answerExists } from "@/src/utils/Database/saver";
import { myStealth } from "@/src/engines/myStealth";
import { formatError } from "@/src/utils/errorFormatter";
import { pressAnyKey } from "@/src/utils/prompt";

// Track task queues
let taskQueues: TaskQueue = {};

// Track start time
let startTime: number = 0;

// Statistics tracking
interface PlatformStats {
    platform: Engines;
    total: number;
    succeeded: number;
    failed: number;
    skipped: number;
}

/**
 * Format elapsed time in human-readable format
 */
function formatElapsedTime(startTime: number): string {
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Load keywords and build task queues from database
 */
const loadTasks = async (targetDate?: string) => {
    console.log('📊 Loading tasks from database...');

    const keywords = await loadKeywordsToQuery(targetDate);
    console.log(`Found ${keywords.length} keywords to query`);

    taskQueues = await buildTaskQueue(keywords);

    const status = getQueueStatus(taskQueues);
    console.log('\n📋 Queue Status:');
    console.log('='.repeat(80));
    for (const { platform, count } of status) {
        console.log(`${platform.padEnd(15)} : ${count} questions pending`);
    }
    console.log('='.repeat(80));
    console.log(`Total Pending: ${status.reduce((sum, s) => sum + s.count, 0)} questions\n`);
};

/**
 * Process tasks for a single engine/platform
 */
const perEngine = async (plat: Engines): Promise<PlatformStats> => {
    const tasks = taskQueues[plat] || [];
    const stats: PlatformStats = {
        platform: plat,
        total: tasks.length,
        succeeded: 0,
        failed: 0,
        skipped: 0
    };

    if (tasks.length === 0) {
        console.log(`No tasks for ${plat}`);
        return stats;
    }

    console.log(`\n🚀 Starting ${plat}: ${tasks.length} tasks`);

    for (const task of tasks) {
        const { keywordId, coreKeyword, extendedKeyword, dateQueried } = task;
        const questionText = extendedKeyword || coreKeyword;

        try {
            // Check if already exists (in case of race condition)
            if (await answerExists(keywordId, plat, extendedKeyword, dateQueried)) {
                stats.skipped++;
                console.log(`⏭️  Skipping ${plat} - ${questionText} (already exists)`);
                console.log(`   📊 ${plat} Stats: ✅ ${stats.succeeded} saved | ❌ ${stats.failed} failed | ⏭️  ${stats.skipped} skipped | 📝 ${stats.total - stats.succeeded - stats.failed - stats.skipped} remaining | ⏱️  ${formatElapsedTime(startTime)}`);
                continue;
            }

            // Bring page to front
            await engines[plat].page.bringToFront();

            // Ask the question
            console.log(`❓ Asking ${plat}: ${questionText}`);
            const rawAnswer = await engines[plat].ask(questionText);

            // Save to database (as HTML)
            await saveAnswer({
                keywordId,
                coreKeyword,
                extendedKeyword,
                platform: plat,
                answer: rawAnswer || "",
                dateQueried,
                answerFormat: 'html'
            });

            // Success message with stats
            stats.succeeded++;
            console.log(`✅ Saved ${plat} - ${questionText}`);
            console.log(`   📊 ${plat} Stats: ✅ ${stats.succeeded} saved | ❌ ${stats.failed} failed | ⏭️  ${stats.skipped} skipped | 📝 ${stats.total - stats.succeeded - stats.failed - stats.skipped} remaining | ⏱️  ${formatElapsedTime(startTime)}`);

        } catch (error) {
            stats.failed++;
            console.error(`❌ Error processing ${plat} - ${questionText}: ${formatError(error)}`);
            console.log(`   📊 ${plat} Stats: ✅ ${stats.succeeded} saved | ❌ ${stats.failed} failed | ⏭️  ${stats.skipped} skipped | 📝 ${stats.total - stats.succeeded - stats.failed - stats.skipped} remaining | ⏱️  ${formatElapsedTime(startTime)}`);
        }
    }

    // Final summary
    console.log(`\n✅ Completed ${plat}`);
    console.log(`📊 Final Stats: ✅ ${stats.succeeded} saved | ❌ ${stats.failed} failed | ⏭️  ${stats.skipped} skipped | Total: ${stats.total} | ⏱️  ${formatElapsedTime(startTime)}\n`);
    return stats;
};

/**
 * Main question loop - database version
 */
export const QuestionLoopDB = async (targetDate?: string, preloadedTaskQueues?: TaskQueue) => {
    // Initialize start time
    startTime = Date.now();

    // Load tasks from database or use preloaded queues
    if (preloadedTaskQueues) {
        console.log('📊 Using preloaded task queues...\n');
        taskQueues = preloadedTaskQueues;

        const status = getQueueStatus(taskQueues);
        console.log('📋 Queue Status:');
        console.log('='.repeat(80));
        for (const { platform, count } of status) {
            console.log(`${platform.padEnd(15)} : ${count} questions pending`);
        }
        console.log('='.repeat(80));
        console.log(`Total Pending: ${status.reduce((sum, s) => sum + s.count, 0)} questions\n`);
    } else {
        await loadTasks(targetDate);
    }

    // Get selected platforms (or all if not specified)
    const selectedPlatforms = globalThis.selectedPlatforms || ["deepseek", "夸克", "kimi", "豆包", "元宝", "文心一言"] as Engines[];

    // Initialize only the selected engines
    console.log('\n🔧 Initializing browser pages for selected platforms...');
    await initializeEngines(selectedPlatforms);
    console.log('✅ All engines initialized\n');

    // Collect promises for all platforms
    const platformPromises: Promise<PlatformStats>[] = [];

    // Start processing each platform in parallel
    for (const plat of selectedPlatforms) {

        // Start processing this platform and collect the promise
        const promise = perEngine(plat);
        platformPromises.push(promise);

        // Anti-freeze mechanisms
        {
            // Periodically bring page to front
            setInterval(() => {
                setTimeout(async() => {
                    await engines[plat].page.bringToFront().catch(() => {});
                }, Math.random() * 20);
            }, 20_000);

            // Apply stealth measures multiple times
            for (let i = 0; i < 10; i++) {
                setInterval(() => {
                    setTimeout(async() => {
                        await engines[plat].page.evaluate(myStealth).catch(() => {
                            // Silently ignore "Execution context was destroyed" errors
                            // These are expected during navigation
                        });
                    }, Math.random() * 20);
                }, 8_000);
            }
        }
    }

    // Wait for all platforms to complete
    const results = await Promise.allSettled(platformPromises);

    // Display summary
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('📊 EXECUTION SUMMARY');
    console.log('═'.repeat(80));

    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalProcessed = 0;

    for (const result of results) {
        if (result.status === 'fulfilled') {
            const stats = result.value;
            const processed = stats.succeeded + stats.failed + stats.skipped;
            totalSucceeded += stats.succeeded;
            totalFailed += stats.failed;
            totalSkipped += stats.skipped;
            totalProcessed += processed;

            const successRate = stats.total > 0
                ? ((stats.succeeded / stats.total) * 100).toFixed(1)
                : '0.0';

            console.log(
                `${stats.platform.padEnd(15)} : ` +
                `✅ ${stats.succeeded.toString().padStart(4)} succeeded | ` +
                `❌ ${stats.failed.toString().padStart(4)} failed | ` +
                `⏭️  ${stats.skipped.toString().padStart(4)} skipped | ` +
                `${successRate.padStart(5)}% success`
            );
        } else {
            console.log(`Platform Error: ${formatError(result.reason)}`);
        }
    }

    console.log('═'.repeat(80));
    console.log(`Total: ✅ ${totalSucceeded} succeeded | ❌ ${totalFailed} failed | ⏭️  ${totalSkipped} skipped`);
    console.log(`⏱️  Total Time: ${formatElapsedTime(startTime)}`);
    console.log('═'.repeat(80));
    console.log();

    // Wait for user to press any key
    await pressAnyKey('Press any key to end...');
    console.log(); // Add newline after key press

    // Kill caffeinate process if it's running
    if (globalThis.caffeinate) {
        console.log('☕ Stopping caffeinate...');
        globalThis.caffeinate.kill();
        console.log('✅ Mac can sleep again\n');
    }
};
