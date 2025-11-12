import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { engines, Engines, initializeEngines } from "@/src/engines/engines";
import { pure } from "@/src/utils/pureHTML";
import { parseProxyUrl } from "@/src/utils/proxyConfig";

declare global {
    var browser: import('puppeteer').Browser;
    var proxyAuth: { username: string; password: string } | null;
}

const TEST_QUESTION = '最好的AI PPT产品是哪个?';

const testPlatform = async (platform: Engines) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Testing Platform: ${platform}`);
    console.log('='.repeat(80));
    console.log(`Question: ${TEST_QUESTION}\n`);

    try {
        // Ask the question
        const startTime = Date.now();
        const rawAnswer = await engines[platform].ask(TEST_QUESTION);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`✅ Raw HTML received (${elapsed}s)`);
        console.log(`Raw HTML length: ${rawAnswer?.length || 0} characters\n`);

        if (rawAnswer) {
            // Show a snippet of raw HTML
            console.log('--- Raw HTML (first 200 chars) ---');
            console.log(rawAnswer.substring(0, 200) + '...\n');

            // Clean HTML
            const cleanedHTML = await pure(rawAnswer);
            console.log(`Cleaned HTML length: ${cleanedHTML?.length || 0} characters\n`);

            // Show cleaned result
            console.log('--- Cleaned HTML Result ---');
            console.log(cleanedHTML);
            console.log('\n--- End of Result ---');
        } else {
            console.log('❌ No answer received');
        }

        return { success: true, platform, elapsed, rawLength: rawAnswer?.length || 0 };

    } catch (error) {
        console.error(`❌ Error testing ${platform}:`, error);
        return { success: false, platform, error: error instanceof Error ? error.message : String(error) };
    }
};

const main = async () => {
    console.log('\n🧪 LLM Scrape Test - Testing HTML Scraping Across All Platforms\n');
    console.log(`Test Question: "${TEST_QUESTION}"\n`);

    // Load env
    await import("dotenv/config");

    // Register plugins
    puppeteer.use(StealthPlugin());

    // Launch browser
    const launchOptions: any = {
        headless: false,
        userDataDir: "./user-data",
        executablePath: process.env.BROWSER_PATH,
    };

    // Add proxy configuration if PROXY_SERVER is set
    if (process.env.PROXY_SERVER) {
        const proxyConfig = parseProxyUrl(process.env.PROXY_SERVER);

        if (proxyConfig) {
            console.log(`Using proxy: ${proxyConfig.server}`);
            launchOptions.args = [`--proxy-server=${proxyConfig.server}`];

            if (proxyConfig.username && proxyConfig.password) {
                globalThis.proxyAuth = {
                    username: proxyConfig.username,
                    password: proxyConfig.password
                };
            }
        }
    }

    globalThis.browser = await puppeteer.launch(launchOptions);

    // Initialize all engines
    const allPlatforms: Engines[] = ["deepseek", "夸克", "kimi", "豆包", "元宝", "文心一言"];

    console.log('🔧 Initializing browser pages for all platforms...');
    await initializeEngines(allPlatforms);
    console.log('✅ All engines initialized\n');

    // Test each platform
    const results = [];
    for (const platform of allPlatforms) {
        const result = await testPlatform(platform);
        results.push(result);

        // Wait a bit between platforms to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    successful.forEach(r => {
        if ('elapsed' in r) {
            console.log(`   - ${r.platform}: ${r.elapsed}s (${r.rawLength} chars)`);
        }
    });

    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
        failed.forEach(r => {
            if ('error' in r) {
                console.log(`   - ${r.platform}: ${r.error}`);
            }
        });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test complete! Press Ctrl+C to exit.\n');

    // Keep process alive to inspect results
    await new Promise(() => {});
};

main().catch(console.error);
