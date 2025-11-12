import { engines, Engines } from "@/src/engines/engines";
import { loadKeywordsToQuery, buildTaskQueue, getQueueStatus, TaskQueue } from "@/src/utils/Database/loader";
import { saveAnswer, answerExists } from "@/src/utils/Database/saver";
import { myStealth } from "@/src/engines/myStealth";
import { pure } from "@/src/utils/pureHTML";
import { formatError } from "@/src/utils/errorFormatter";

// Track task queues
let taskQueues: TaskQueue = {};

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
const perEngine = async (plat: Engines) => {
    const tasks = taskQueues[plat] || [];

    if (tasks.length === 0) {
        console.log(`No tasks for ${plat}`);
        return;
    }

    console.log(`\n🚀 Starting ${plat}: ${tasks.length} tasks`);

    for (const task of tasks) {
        const { keywordId, coreKeyword, extendedKeyword, dateQueried } = task;
        const questionText = extendedKeyword || coreKeyword;

        try {
            // Check if already exists (in case of race condition)
            if (await answerExists(keywordId, plat, extendedKeyword, dateQueried)) {
                console.log(`⏭️  Skipping ${plat} - ${questionText} (already exists)`);
                continue;
            }

            // Bring page to front
            await engines[plat].page.bringToFront();

            // Ask the question
            console.log(`❓ Asking ${plat}: ${questionText}`);
            const rawAnswer = await engines[plat].ask(questionText);

            // Convert to markdown
            const answer = await pure(rawAnswer || "");

            // Save to database
            await saveAnswer({
                keywordId,
                coreKeyword,
                extendedKeyword,
                platform: plat,
                answer,
                dateQueried,
                answerFormat: 'md'
            });

            // Success message
            console.log(`✅ Saved ${plat} - ${questionText}`);

        } catch (error) {
            console.error(`❌ Error processing ${plat} - ${questionText}: ${formatError(error)}`);
        }
    }

    console.log(`✅ Completed ${plat}\n`);
};

/**
 * Main question loop - database version
 */
export const QuestionLoopDB = async (targetDate?: string) => {
    // Load tasks from database
    await loadTasks(targetDate);

    // Start processing each platform in parallel
    for (const platformKey in engines) {
        const plat = platformKey as Engines;

        // Start processing this platform
        perEngine(plat).catch(e => {
            console.error(`❌ Engine ${plat} Error: ${formatError(e)}`);
        });

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
};
