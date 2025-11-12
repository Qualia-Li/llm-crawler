import {Page} from "puppeteer";
import {Engines} from "./engines";

export class BaseEngine {
    page!: Page
    engineName!: Engines
    initialized: boolean = false;

    async init() {
        if (this.initialized) return this.ask
        this.page = await globalThis.browser.newPage();

        // Set up proxy authentication if credentials are available
        if (globalThis.proxyAuth) {
            await this.page.authenticate(globalThis.proxyAuth);
        }

        await this.page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: false,
        });
        // await this.page.setRequestInterception(true);
        this.initialized = true;
        return this.ask
    }

    /**
     * Check if page contains login-related text and wait for user to log in
     */
    async waitForLogin() {
        const loginKeywords = ['email', '邮箱', 'login', 'sign in', '登录', '登陆', 'password', '密码'];

        while (true) {
            try {
                // Get page text content
                const bodyText = await this.page.evaluate(() => document.body.innerText.toLowerCase());

                // Check if any login keyword is present
                const hasLoginKeyword = loginKeywords.some(keyword =>
                    bodyText.includes(keyword.toLowerCase())
                );

                if (hasLoginKeyword) {
                    console.log(`⏳ ${this.engineName}: Login page detected. Waiting for login to complete...`);
                    // Wait 5 seconds before checking again
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    // No login keywords found, assume logged in
                    break;
                }
            } catch (error) {
                // If error occurs, break and let the calling code handle it
                console.log(`⚠️  ${this.engineName}: Error checking for login, proceeding anyway`);
                break;
            }
        }
    }

    async ask(_question: string) {
        await this.page.bringToFront()
        return ""
    }
}