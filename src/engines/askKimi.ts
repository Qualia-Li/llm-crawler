import {BaseEngine} from "@/src/engines/base";
import {Engines} from "@/src/engines/engines";

export class askKimi extends BaseEngine {
    engineName: Engines = "kimi"

    async ask(question: string) {
        // Navigate tpo kimi
        await this.page.goto('https://www.kimi.com/', {waitUntil: 'networkidle2'});

        // Wait for login if needed
        await this.waitForLogin();

        // Click input editor
        const inputSelector = 'div.chat-input-editor';
        await this.page.click(inputSelector);

        // Type question
        await this.page.type(inputSelector, `${question}`);

        // Press Enter
        await this.page.keyboard.press('Enter');

        // Wait for finish: like button
        // It takes longer
        await this.page.locator(`[name="Like"]`).setTimeout(100_0000).wait()

        // Get response
        const resEl = this.page.locator(".segment-container:has(.paragraph)");
        //Refer
/*        const links = this.page.locator(`.sites`)
        const referText = await links.map(link=>link.innerHTML).wait()
        text = `${text}\n\n\n <h2>References</h2>\n (${referText})`*/

        // Return
        return await resEl.map((el) => el.innerHTML).wait()
    }
}
