import {BaseEngine} from "./base";
 
import {Engines} from "./engines";

export class askErnie extends BaseEngine {
    engineName: Engines = "文心一言";

    async ask(question: string) {
        return await this.askOne(question)
    }

    private async askOne(text: string) {
        // Navigate to the chat URL (a finished chat)
        await this.page.goto(`https://chat.baidu.com/search?word=${encodeURIComponent(text)}`, {
            waitUntil: 'networkidle0',
        });

        // Wait answer;
        await this.page.waitForSelector('[class*="answer-container"]', {timeout: 50_000});

        //open reference
        await this.page.click(".thinking-steps-title-extra")

        return await this.page
            .locator(`[class*="cos-icon-copy icon"]`)
            .map((el) => el.innerHTML)
            .wait();
    }
}