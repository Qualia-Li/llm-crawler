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
     * DISABLED: Login detection is disabled to speed up scraping
     */
    async waitForLogin() {
        // Login detection disabled
        return;
    }

    async ask(_question: string) {
        await this.page.bringToFront()
        return ""
    }
}