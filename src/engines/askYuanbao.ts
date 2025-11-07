import {BaseEngine} from "@/src/engines/base";
import {Engines} from "@/src/engines/engines";

export class askYuanbao extends BaseEngine {

    engineName: Engines = "元宝"

    /**
     * Sends a question to Yuanbao and waits for the AI response.
     * @param {string} question - The user's input question.
     * @returns {Promise<string>} - The inner HTML of the AI's response message.
     */
    async ask(question: string): Promise<string> {
        // Navigate to the chat URL
        await this.page.goto('https://yuanbao.tencent.com/chat/naQivTmsDa', {
            waitUntil: 'networkidle0',
        });

        // Type the question into the input area
        const inputSelector = '[contenteditable="true"]';
        await this.page.type(inputSelector, question);

        // Press Enter and wait for response
        const waitAnswer = this.page.waitForNavigation({waitUntil: 'networkidle0', timeout: 500_000});
        await this.page.keyboard.press('Enter');
        await waitAnswer;

        // Wait for the like button (indicator that response loaded)
        await this.page.waitForSelector('.agent-chat__toolbar__suitable', {timeout: 50_0000});

        // Return the HTML content of the AI's message
        return await this.page
            .locator('.agent-chat__conv--ai__speech_show')
            .map((el) => el.innerHTML)
            .wait();
    }
}