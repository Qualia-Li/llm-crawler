import {BaseEngine} from "@/src/engines/base";
import {Engines} from "@/src/engines/engines";
import {SearchKeyword} from "@/src/question-list";

export class askKimi extends BaseEngine {
    engineName: Engines = "kimi"

    async ask(question: SearchKeyword) {
        // Navigate tpo kimi
        await this.page.goto('https://www.kimi.com/', {waitUntil: 'networkidle2'});

        // Click input editor
        const inputSelector = 'div.chat-input-editor';
        await this.page.click(inputSelector);

        // Type question
        await this.page.type(inputSelector, `${question.coreKeyword}`);

        // Press Enter
        await this.page.keyboard.press('Enter');

        // Wait for finish: like button
        // It takes longer
        await this.page.locator(`[name="Like"]`).setTimeout(100_0000).wait()

        // Get response
        const resEl = this.page.locator(".segment-container:has(.paragraph)");
        let text = await resEl.map((el) => el.innerHTML).wait();

        //Refer
        const links = this.page.locator(`.sites`)
        const referText = await links.map(link=>link.innerHTML).wait()
        text = `${text}\n\n\n <h2>References</h2>\n (${referText})`

        // Return
        return [text]
    }
}
