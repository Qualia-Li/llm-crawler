import {Page} from "puppeteer";
import {SearchKeyword} from "../question-list";
import {Engines} from "./engines";

export class BaseEngine {
    page!:Page
    engineName!:Engines
    initialized:boolean = false;

    async init() {
        if(this.initialized) return this.ask
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
        this.initialized=true;
        return this.ask
    }
    async ask(_question:SearchKeyword){
        throw new Error("Not implemented");
        return [""]
    }

    // @ts-ignore
    #submit(question: SearchKeyword, answer: string[]){
        question.platforms.set(this.engineName,answer)
    }
}