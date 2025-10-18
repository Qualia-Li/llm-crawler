import {Page} from "puppeteer";
import {SearchKeyword} from "../question-list";
import {Engines} from "./engines";

export class BaseEngine {
    page!:Page
    engineName!:Engines
    initialized:boolean = false;

    async init() {
        this.page = await globalThis.browser.newPage();
        await this.page.setViewport({
            width: 1000,
            height: 450,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: false,
        });
        this.initialized=true;
        return this.ask
    }

    /**
     *
     * @param _question pointer
     */
    async ask(_question:SearchKeyword){
        throw new Error("Not implemented");
    }

    // @ts-ignore
    #submit(question: SearchKeyword, answer: string[]){
        question.platforms.set(this.engineName,answer)
    }
}