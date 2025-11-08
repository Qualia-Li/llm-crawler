import {BaseEngine} from "./base";
 
import {Engines} from "./engines";

export class askDoubao extends BaseEngine {
    engineName: Engines = "豆包";

    async ask(text: string) {
        // Navigate to Doubao
        await this.page.goto('https://www.doubao.com/chat/', {waitUntil: 'networkidle2'});

        // Click the input area
        const inputSelector = '[data-testid="chat_input_input"]';
        await this.page.waitForSelector(inputSelector);
        await this.page.click(inputSelector);

        // Type message
        await this.page.waitForSelector(inputSelector);
        await this.page.type(inputSelector, text);

        // Press Enter
        const waitAnswer = this.page.waitForNavigation({waitUntil: "networkidle0", timeout: 500000});
        await this.page.keyboard.press('Enter');

        // Wait for the search results to load
        await waitAnswer;
        await this.page.waitForSelector(
            "[data-testid=\"message_action_like\"] svg", {timeout: 50_0000});

        return await this.page
            .locator("[data-testid=\"message_content\"]:has(*:not(div))")
            .map((el) => el.innerHTML)
            .wait();
    }
}