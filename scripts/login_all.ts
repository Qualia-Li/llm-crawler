import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { parseProxyUrl } from "../src/utils/proxyConfig";
import "dotenv/config";

// Platform URLs
const PLATFORMS = [
    { name: "DeepSeek", url: "https://chat.deepseek.com/" },
    { name: "Kimi", url: "https://www.kimi.com/" },
    { name: "豆包 (Doubao)", url: "https://www.doubao.com/chat/" },
    { name: "元宝 (Yuanbao)", url: "https://yuanbao.tencent.com/chat" },
    { name: "夸克 (Quark)", url: "https://ai.quark.cn/" },
    { name: "文心一言 (Ernie)", url: "https://chat.baidu.com/" },
];

async function loginAll() {
    console.log("🔐 Starting login session for all platforms...\n");

    // Register stealth plugin
    puppeteer.use(StealthPlugin());

    // Launch browser with same config as main app
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
        }
    }

    const browser = await puppeteer.launch(launchOptions);

    console.log("📂 Browser opened with user-data directory: ./user-data\n");
    console.log("Opening all platforms in separate tabs...\n");

    // Open all platforms in separate tabs
    const pages = [];
    for (const platform of PLATFORMS) {
        console.log(`  ✓ Opening ${platform.name}...`);
        const page = await browser.newPage();

        // Set up proxy authentication if credentials are available
        const proxyAuth = process.env.PROXY_SERVER ? parseProxyUrl(process.env.PROXY_SERVER) : null;
        if (proxyAuth?.username && proxyAuth?.password) {
            await page.authenticate({
                username: proxyAuth.username,
                password: proxyAuth.password,
            });
        }

        await page.setViewport({
            width: 1200,
            height: 800,
        });

        try {
            await page.goto(platform.url, {
                waitUntil: "networkidle2",
                timeout: 30000
            });
        } catch (error) {
            console.log(`  ⚠️  ${platform.name} may have taken longer to load`);
        }

        pages.push({ platform: platform.name, page });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ All platforms opened!");
    console.log("=".repeat(60));
    console.log("\n📝 Instructions:");
    console.log("  1. Switch between tabs and log in to each platform");
    console.log("  2. Make sure you're fully logged in before closing");
    console.log("  3. Close the browser window when done");
    console.log("  4. Your sessions will be saved automatically\n");
    console.log("Platforms opened:");
    for (const platform of PLATFORMS) {
        console.log(`  • ${platform.name} - ${platform.url}`);
    }
    console.log("\n⏳ Keeping browser open... Press Ctrl+C to exit");

    // Keep the script running until browser is closed
    await new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
            try {
                const targets = await browser.targets();
                if (targets.length === 0 || !browser.isConnected()) {
                    clearInterval(checkInterval);
                    resolve(null);
                }
            } catch (error) {
                clearInterval(checkInterval);
                resolve(null);
            }
        }, 1000);
    });

    console.log("\n✅ Browser closed. Login sessions saved!");
    process.exit(0);
}

loginAll().catch((error) => {
    console.error("❌ Error during login:", error);
    process.exit(1);
});
