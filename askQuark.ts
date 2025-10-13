import { Locator, Page, Viewport } from "puppeteer";

export async function askQuark(page: Page, question: string) {
    // Navigate to the page
    await page.goto("https://ai.quark.cn/", { waitUntil: "networkidle0" });

    // Click on the search input field
    await page.click("textarea");
    // xpath///*[@id=\"root\"]/div/div[1]/div/div[2]/div/div[2]/div/div/div[2]/div[1]/div/textarea

    // Type the search query
    await page.type("textarea", question);

    // Ensure think
    if (!(await page.$(".deep-think-bar.active")))
        await page.locator(".deep-think-bar").click();

    // Send message
    //await page.keyboard.press("Enter");
    const waitAnswer = page.waitForNavigation({ waitUntil: "networkidle0" });
    await page.locator(`.search-bar-container-inner-btn`).click();

    // Wait for the search results to load
    await waitAnswer
    await page.waitForSelector(
        // "div.sgs-common-paa > div > div.qk-view > div:nth-of-type(1) div.qk-text",
        // '[data-bar="Generated"]',
        ".qk-md-paragraph",
        { timeout: 70_0000 }
    );

    return await page
        .locator("#sgs-container")
        .map((el) => el.innerHTML)
        .wait();
}
