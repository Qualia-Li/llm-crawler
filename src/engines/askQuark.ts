import {BaseEngine} from "./base";
import {SearchKeyword} from "../question-list";
import {Engines} from "./engines";

export class askQuark extends BaseEngine {
    engineName: Engines = "夸克";

    async ask(question: SearchKeyword) {
        /* Quark do not support appending. */
        const arr = [
            await this.askOne(question.coreKeyword),
        ]

        //no need now
        /*for (const extendedKeyword of question.extendedKeywords) {
            arr.push(await this.askOne(extendedKeyword))
        }*/

        return arr
    }

    private async askOne(text: string) {
        // Navigate to the page
        await this.page.goto("https://ai.quark.cn/", {waitUntil: "networkidle0"});

        // Click on the search input field
        await this.page.click("textarea");
        // xpath///*[@id=\"root\"]/div/div[1]/div/div[2]/div/div[2]/div/div/div[2]/div[1]/div/textarea

        // Type the search query
        await this.page.type("textarea", text);

        // Ensure think
        if (!(await this.page.$(".deep-think-bar.active"))) {
            await this.page.locator(".deep-think-bar").click();
        }

        // Send message
        //await this.page.keyboard.press("Enter");
        const waitAnswer = this.page.waitForNavigation({waitUntil: "networkidle0", timeout: 500000}); // Note: timeout seems very high, maybe 50000 was intended?
        await this.page.locator(`.search-bar-container-inner-btn`).click();

        // Wait for the search results to load
        await waitAnswer;
        await this.page.waitForSelector(
            // "div.sgs-common-paa > div > div.qk-view > div:nth-of-type(1) div.qk-text",
            // '[data-bar="Generated"]',
            ".qk-md-paragraph",
            {timeout: 700000} // Note: timeout seems very high, maybe 70000 was intended?
        );

        return await this.page
            .locator("#sgs-container")
            .map((el) => el.innerHTML)
            .wait();
    }
}