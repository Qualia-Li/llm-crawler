import puppeteer from "puppeteer-extra";

// Add stealth plugin
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { askDate, confirm } from "./utils/prompt";
import { loadKeywordsToQuery, buildTaskQueue, getQueueSummary } from "./utils/Database/loader";

declare global {
    var browser: import('puppeteer').Browser;
    var targetDate: string;
}

/**
 * Interactive setup: Ask for date and show summary
 */
const interactiveSetup = async () => {
    console.log('\n🤖 LLM Crawler - Database Mode\n');

    // Step 1: Ask for target date
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const targetDate = await askDate(today);
    globalThis.targetDate = targetDate;

    console.log(`\n📅 Target Date: ${targetDate}\n`);

    // Step 2: Load keywords and build queue
    console.log('📊 Loading tasks from database...');
    const keywords = await loadKeywordsToQuery(targetDate);

    if (keywords.length === 0) {
        console.log('✅ No keywords need to be queried for this date.');
        process.exit(0);
    }

    console.log(`Found ${keywords.length} keywords to query\n`);

    const taskQueues = await buildTaskQueue(keywords);
    const summary = await getQueueSummary(keywords, taskQueues);

    // Step 3: Display summary
    console.log('═'.repeat(80));
    console.log('📋 QUERY SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total Keywords      : ${summary.totalKeywords}`);
    console.log(`Total Questions     : ${summary.totalQuestions}`);
    console.log(`✅ Completed        : ${summary.completedQuestions} (${((summary.completedQuestions / summary.totalQuestions) * 100).toFixed(1)}%)`);
    console.log(`⏳ Pending          : ${summary.pendingQuestions} (${((summary.pendingQuestions / summary.totalQuestions) * 100).toFixed(1)}%)`);
    console.log('═'.repeat(80));
    console.log('\n📊 Platform Breakdown:');
    console.log('─'.repeat(80));

    for (const stat of summary.platformStats) {
        const percentComplete = ((stat.completed / stat.total) * 100).toFixed(1);
        console.log(
            `${stat.platform.padEnd(15)} : ` +
            `✅ ${stat.completed.toString().padStart(4)} / ${stat.total.toString().padStart(4)} ` +
            `(${percentComplete.padStart(5)}%) | ` +
            `⏳ ${stat.pending} pending`
        );
    }
    console.log('─'.repeat(80));

    // Step 4: Ask for confirmation
    console.log();
    const shouldContinue = await confirm('🚀 Start querying?');

    if (!shouldContinue) {
        console.log('\n❌ Cancelled by user.');
        process.exit(0);
    }

    console.log('\n✅ Starting crawler...\n');
};

//Main
const main = async () => {
    //Load env
    await import("dotenv/config");

    // Interactive setup
    await interactiveSetup();

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
        console.log(`Using proxy: ${process.env.PROXY_SERVER}`);
        launchOptions.args = [
            `--proxy-server=${process.env.PROXY_SERVER}`
        ];
    }

    globalThis.browser = await puppeteer.launch(launchOptions);

    //Question Loop (Database Version)
    const {QuestionLoopDB} = await import("./QuestionLoopDB");
    await QuestionLoopDB(globalThis.targetDate);
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
