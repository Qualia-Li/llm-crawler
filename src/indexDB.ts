import puppeteer from "puppeteer-extra";
import { spawn } from "child_process";
import type { ChildProcess } from "child_process";

// Add stealth plugin
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { askDate, confirm, askPlatforms } from "./utils/prompt";
import { loadKeywordsToQuery, loadCustomKeywords, buildTaskQueue, getQueueSummary } from "./utils/Database/loader";
import { parseProxyUrl } from "./utils/proxyConfig";
import { Engines } from "./engines/engines";

declare global {
    var browser: import('puppeteer').Browser;
    var targetDate: string;
    var selectedPlatforms: Engines[];
    var proxyAuth: { username: string; password: string } | null;
    var caffeinate: ChildProcess | null;
}

/**
 * Interactive setup: Ask for date and show summary
 * Returns the task queues to be used by QuestionLoopDB
 */
const interactiveSetup = async () => {
    console.log('\n🤖 LLM Crawler - Database Mode\n');

    // Check for custom config file and yes flag
    const configArg = process.argv.find(arg => arg.startsWith('--config='));
    const configPath = configArg?.split('=')[1];
    // Auto-yes if using custom config or explicit --yes flag
    const autoYes = !!configPath || process.argv.includes('--yes') || process.argv.includes('-y');

    // Step 1: Ask for target date
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const targetDate = autoYes ? today : await askDate(today);
    globalThis.targetDate = targetDate;

    console.log(`\n📅 Target Date: ${targetDate}\n`);

    let keywords;
    let selectedPlatforms: Engines[];

    if (configPath) {
        // Load from custom config file
        console.log(`📄 Loading custom config from: ${configPath}`);
        keywords = await loadCustomKeywords(configPath, targetDate);

        if (keywords.length === 0) {
            console.log('❌ No keywords loaded from config file. Exiting.');
            process.exit(0);
        }

        // Collect all unique platforms from custom config
        const platformSet = new Set<Engines>();
        keywords.forEach(k => k.platforms.forEach(p => platformSet.add(p)));
        selectedPlatforms = Array.from(platformSet);

        console.log(`Loaded ${keywords.length} custom keyword configurations`);
        console.log(`Platforms from config: ${selectedPlatforms.join(', ')}\n`);
    } else {
        // Normal mode: ask for platform selection
        const allPlatforms: Engines[] = ["deepseek", "夸克", "kimi", "豆包", "元宝", "文心一言"];
        selectedPlatforms = await askPlatforms(allPlatforms);

        if (selectedPlatforms.length === 0) {
            console.log('\n❌ No platforms selected. Exiting.');
            process.exit(0);
        }

        // Load keywords from database
        console.log('📊 Loading tasks from database...');
        keywords = await loadKeywordsToQuery(targetDate);

        if (keywords.length === 0) {
            console.log('✅ No keywords need to be queried for this date.');
            process.exit(0);
        }

        console.log(`Found ${keywords.length} keywords to query\n`);
    }

    globalThis.selectedPlatforms = selectedPlatforms;

    const taskQueues = await buildTaskQueue(keywords);
    const summary = await getQueueSummary(keywords, taskQueues);

    // Filter summary to only show selected platforms
    const filteredPlatformStats = summary.platformStats.filter(
        stat => selectedPlatforms.includes(stat.platform as Engines)
    );
    const filteredPendingQuestions = filteredPlatformStats.reduce((sum, stat) => sum + stat.pending, 0);
    const filteredCompletedQuestions = filteredPlatformStats.reduce((sum, stat) => sum + stat.completed, 0);
    const filteredTotalQuestions = filteredPlatformStats.reduce((sum, stat) => sum + stat.total, 0);

    // Step 4: Display summary
    console.log('═'.repeat(80));
    console.log('📋 QUERY SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total Core Keywords      : ${summary.totalKeywords}`);
    console.log(`Total Questions     : ${filteredTotalQuestions}`);

    const completedPercent = filteredTotalQuestions > 0
        ? ((filteredCompletedQuestions / filteredTotalQuestions) * 100).toFixed(1)
        : '0.0';
    const pendingPercent = filteredTotalQuestions > 0
        ? ((filteredPendingQuestions / filteredTotalQuestions) * 100).toFixed(1)
        : '0.0';

    console.log(`✅ Completed        : ${filteredCompletedQuestions} (${completedPercent}%)`);
    console.log(`⏳ Pending          : ${filteredPendingQuestions} (${pendingPercent}%)`);
    console.log('═'.repeat(80));
    console.log('\n📊 Platform Breakdown:');
    console.log('─'.repeat(80));

    for (const stat of filteredPlatformStats) {
        const percentComplete = ((stat.completed / stat.total) * 100).toFixed(1);
        console.log(
            `${stat.platform.padEnd(15)} : ` +
            `✅ ${stat.completed.toString().padStart(4)} / ${stat.total.toString().padStart(4)} ` +
            `(${percentComplete.padStart(5)}%) | ` +
            `⏳ ${stat.pending} pending`
        );
    }
    console.log('─'.repeat(80));

    // Step 5: Ask for confirmation
    console.log();
    let shouldContinue = true;

    if (autoYes) {
        console.log('🚀 Starting crawler...\n');
    } else {
        shouldContinue = await confirm('🚀 Start querying?');

        if (!shouldContinue) {
            console.log('\n❌ Cancelled by user.');
            process.exit(0);
        }

        console.log('\n✅ Starting crawler...\n');
    }

    // Return task queues for QuestionLoopDB
    return taskQueues;
};

//Main
const main = async () => {
    //Load env
    await import("dotenv/config");

    // Interactive setup - returns task queues for custom config mode
    const customTaskQueues = await interactiveSetup();

    // Start caffeinate to keep Mac awake (macOS only)
    if (process.platform === 'darwin') {
        console.log('☕ Starting caffeinate to keep Mac awake...');
        globalThis.caffeinate = spawn('caffeinate', ['-d']);
        console.log('✅ Mac will stay awake during execution\n');

        // Ensure caffeinate is killed on process exit
        const cleanup = () => {
            if (globalThis.caffeinate) {
                globalThis.caffeinate.kill();
            }
        };
        process.on('exit', cleanup);
        process.on('SIGINT', () => {
            cleanup();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            cleanup();
            process.exit(0);
        });
    }

    //Register plugins before launching browser
    puppeteer.use(StealthPlugin());

    //Launch browser with optional proxy support
    const launchOptions: any = {
        headless: false,
        userDataDir: "./user-data",
        executablePath: process.env.BROWSER_PATH,//ok to be undefined
    };

    // Add proxy configuration if PROXY_SERVER is set
    if (process.env.PROXY_SERVER) {
        const proxyConfig = parseProxyUrl(process.env.PROXY_SERVER);

        if (proxyConfig) {
            console.log(`Using proxy: ${proxyConfig.server}`);
            launchOptions.args = [
                `--proxy-server=${proxyConfig.server}`
            ];

            // Store credentials globally for page authentication
            if (proxyConfig.username && proxyConfig.password) {
                globalThis.proxyAuth = {
                    username: proxyConfig.username,
                    password: proxyConfig.password
                };
            }
        }
    }

    globalThis.browser = await puppeteer.launch(launchOptions);

    //Question Loop (Database Version)
    const {QuestionLoopDB} = await import("./QuestionLoopDB");
    await QuestionLoopDB(globalThis.targetDate, customTaskQueues);
};

const retry = async (e = "Start" as any, retryCount = 0) => {
    const MAX_RETRIES = 3;

    console.log("Retried because of the err below:");
    console.error(e);

    // Check if error is about browser already running
    if (e?.message?.includes("browser is already running")) {
        console.error("\n❌ ERROR: Browser is already running!");
        console.error("Please close any existing Chrome instances or run: pkill -f 'Google Chrome for Testing.*user-data'");
        process.exit(1);
    }

    if (retryCount >= MAX_RETRIES) {
        console.error(`\n❌ Max retries (${MAX_RETRIES}) reached. Exiting...`);
        process.exit(1);
    }

    console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}...`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
    await main().catch(e => retry(e, retryCount + 1));
};

await retry();
