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
        await this.page.goto('https://yuanbao.tencent.com/chat', {
            waitUntil: 'domcontentloaded',
        });

        // Wait for login if needed
        await this.waitForLogin();

        // Type the question into the input area
        const inputSelector = '[contenteditable="true"]';
        await this.page.type(inputSelector, question);

        // Press Enter and wait for response
        await Promise.all([
            this.page.keyboard.press('Enter'),
            this.page.waitForNavigation({waitUntil: 'networkidle0', timeout: 500_000})
        ]);

        // Wait for the like button (indicator that response loaded)
        await this.page.waitForSelector('.agent-chat__toolbar__suitable', {timeout: 50_0000});
/*        const refBtn = await this.page.$(".agent-chat__toolbar__item.agent-chat__search-guid-tool")
        refBtn?.asLocator().click();
        const ref = await this.page.$(".agent-dialogue-references__list")
        const refHTML =  await  ref?.asLocator().map((el) => el.innerHTML)
            .wait();

        (await this.page.$$(".hyc-common-markdown__ref-list__item")).map(el=>el.hover())
        const a = await this.page.$$(".hyc-common-markdown__ref_card")
        const b =await Promise.all( a.map(async el => {
            await el.hover();
            return await el.asLocator().map((el) => el.innerHTML).wait()
        }))*/

        // Return the HTML content of the AI's message
        return await this.page
            .locator('.agent-chat__conv--ai__speech_show')
            .map((el) => el.innerHTML)
            .wait();
    }
}