import puppeteer, { Page } from "puppeteer";
import { questionList } from "./question-list";
import fs from "node:fs/promises";

const userDataDir = "./user-data";

const results: { question: string; answer: string/* html */; refer?: string[]/* url */ }[] = [];

const Main = async () => {
    //Launch browser
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
        userDataDir: userDataDir,
    });

    const page = await browser.newPage();

    //Question Loop
    for (const question of questionList) {
        const answer = await askOneQuestion(page, question);
        results.push({
            question: question,
            answer: answer,
            //refer:answer.match("^(https?|ftp):\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/\S*)?$")?.groups
        });
        console.log(
            answer.match(
                "^(https?|ftp)://[a-zA-Z0-9-.]+.[a-zA-Z]{2,}(:[0-9]{1,5})?(/S*)?$"
            )
        );
        //localforage.setItem("results", results);
        fs.writeFile("./results.json", JSON.stringify(results));
    }
};

async function askOneQuestion(page: Page, question: string) {
    // Set viewport
    await page.setViewport({
        width: 800,
        height: 600,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: false,
    });

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
    const resEl = page.locator("div.ds-markdown").setTimeout(50_0000);
    const text = await resEl.map((el) => el.innerHTML).wait();

    return text;
}

Main();
