import { Page } from "puppeteer";

export async function askDeepseek(page: Page, question: string) {

    // Navigate to the URL
    await page.goto(
        "https://chat.deepseek.com/",
        // "https://chat.deepseek.com/a/chat/s/760a740d-66d7-4697-b565-4e9861556bc4",//for test
        { waitUntil: "domcontentloaded" }
    );

    // Click on the textarea using the most reliable selector
    const textareaSelector = "textarea";
    await page.waitForSelector(textareaSelector);
    await page.click(textareaSelector, {
        offset: {
            x: 204.33333206176758,
            y: 17.333328247070312,
        },
    });

    // Type the message
    await TypeMessage();
    async function TypeMessage() {
        await page.type(textareaSelector, question, {
            delay: 100, // Add slight delay for more natural typing
        });

        // Press Enter key
        await page.keyboard.press("Enter");
    }

    // Wait for the response element
    await page.waitForSelector(
        `::-p-xpath(//*[@id="root"]/div/div/div[2]/div[3]/div/div[2]/div/div[2]/div[1]/div[2]/div[3]/div[1]/div[1])`,
        { timeout: 0 }
    );
    const resEl = page.locator("div.ds-markdown").setTimeout(500000);
    const text = await resEl.map((el) => el.innerHTML).wait();

    return text;
}
