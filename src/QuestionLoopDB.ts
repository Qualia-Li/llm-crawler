import { engines, Engines, initializeEngines } from "@/src/engines/engines";
import { loadKeywordsToQuery, buildTaskQueue, getQueueStatus, TaskQueue } from "@/src/utils/Database/loader";
import { saveAnswer, answerExists } from "@/src/utils/Database/saver";
import { myStealth } from "@/src/engines/myStealth";
import { formatError } from "@/src/utils/errorFormatter";
import { pressAnyKey } from "@/src/utils/prompt";

// Track task queues
let taskQueues: TaskQueue = {};

// Statistics tracking
interface PlatformStats {
    platform: Engines;
    total: number;
    succeeded: number;
    failed: number;
    skipped: number;
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
                console.log(`⏭️  Skipping ${plat} - ${questionText} (already exists)`);
                stats.skipped++;
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

            // Success message
            console.log(`✅ Saved ${plat} - ${questionText}`);
            stats.succeeded++;

        } catch (error) {
            console.error(`❌ Error processing ${plat} - ${questionText}: ${formatError(error)}`);
            stats.failed++;
        }
    }

    console.log(`✅ Completed ${plat}\n`);
    return stats;
};

/**
 * Main question loop - database version
 */
export const QuestionLoopDB = async (targetDate?: string) => {
    // Load tasks from database
    await loadTasks(targetDate);

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
    console.log('═'.repeat(80));
    console.log();

    // Wait for user to press any key
    await pressAnyKey('Press any key to end...');
    console.log(); // Add newline after key press
};
