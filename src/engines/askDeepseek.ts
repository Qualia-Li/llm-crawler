import {BaseEngine} from "./base";
import {SearchKeyword} from "../question-list";
import {Engines} from "./engines";
import TurndownService from "turndown"
import {convertInlineToReference} from "@/src/utils/markdown";

export class askDeepseek extends BaseEngine {
    engineName: Engines = "deepseek"

    async init() {
        const a = await super["init"]();
        await this.page.evaluateOnNewDocument(() => {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const [url, options] = args;
                if (url.includes('/api/v0/chat/completion')) {
                    const response = await originalFetch(...args);
                    if (response.body) {
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();
                        let buffer = '';

                        reader.read().then(function process({ done, value }) {
                            if (done) return;
                            buffer += decoder.decode(value, { stream: true });
                            // Log SSE chunks (e.g., " {...}\n\n")
                            console.log('SSE Chunk:', buffer);
                            reader.read().then(process);
                        });
                    }
                    return response;
                }
                return originalFetch(...args);
            };
        });
        return a;
    }

    async ask(question: SearchKeyword) {
        /*this.page.on('requestfinished', (request) => {
            /!**https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-streamResourceContent*!/
            if (request.isInterceptResolutionHandled()) return;
            const url = request.url();
            console.log("url")
            if (url === 'https://chat.deepseek.com/api/v0/chat/completion') {
                //console.log(request.response()?.content())
            }
            // request.continue();
        });*/


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
        await this.page.type("textarea", question.coreKeyword, {
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
        const text = await resEl.map((el) => el.innerHTML).wait();
        var turndownService = new TurndownService();

        var markdown = turndownService.turndown(text);
        markdown = convertInlineToReference(markdown)
        console.log(markdown);
        return [markdown]
    }
}
