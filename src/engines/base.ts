import {Page} from "puppeteer";
import {Engines} from "./engines";

export class BaseEngine {
    page!: Page
    engineName!: Engines
    initialized: boolean = false;

    async init() {
        if (this.initialized) return this.ask
        this.page = await globalThis.browser.newPage();
        await this.page.setViewport({
            width: 1000,
            height: 450,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: false,
        });
        // await this.page.setRequestInterception(true);
        this.initialized = true;
        return this.ask
    }

    async ask(_question: string) {
        await this.page.bringToFront()
        return ""
    }
}