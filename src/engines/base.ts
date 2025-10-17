import {Browser, Page} from "puppeteer";
import {SearchKeyword} from "../question-list";

export class BaseEngine {
    page!:Page

    async init(browser: Browser) {
        this.page = await browser.newPage();
        await page.setViewport({
            width: 1000,
            height: 600,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: false,
        });
    }

    /**
     *
     * @param question pointer
     */
    async ask(question:SearchKeyword){
        throw new Error("Not implemented");
    }
}