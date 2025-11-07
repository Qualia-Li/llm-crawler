import {BaseEngine} from "./base";

import {Engines} from "./engines";

export class askDeepseek extends BaseEngine {
    engineName: Engines = "deepseek"

    async ask(question: string) {
        // Navigate to the URL
        await this.page
            .goto(
                "https://chat.deepseek.com/",
                // "https://chat.deepseek.com/a/chat/s/760a740d-66d7-4697-b565-4e9861556bc4",//for test
                {waitUntil: "domcontentloaded"}
            );

        // Click on the textarea using the most reliable selector
        await this.page.waitForSelector("textarea");
        await this.page.click("textarea",);

        // Type the message
        await this.page.type("textarea", question, {
            delay: 100, // Add slight delay for more natural typing
        });


        // Press Enter key
        await this.page.keyboard.press("Enter");

        // Wait for the response element
        await this.page.waitForSelector(
            `::-p-xpath(//*[@id="root"]/div/div/div[2]/div[3]/div/div[2]/div/div[2]/div[1]/div[2]/div[3]/div[1]/div[1])`,
            {timeout: 0}
        );

        const resEl = this.page.locator("div.ds-markdown").setTimeout(500000);
        return await resEl.map((el) => el.innerHTML).wait()
    }
}
