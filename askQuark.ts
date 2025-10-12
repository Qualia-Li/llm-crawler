import { Locator, Page, Viewport } from "puppeteer";

export async function askQuark(page: Page, question: string) {
    await page.setViewport({ width: 753, height: 820 });

    // Navigate to the page
    await page.goto("https://ai.quark.cn/", { waitUntil: "networkidle0" });

    // Click on the search input field
    await page.click("textarea");
    // xpath///*[@id=\"root\"]/div/div[1]/div/div[2]/div/div[2]/div/div/div[2]/div[1]/div/textarea

    // Type the search query
    await page.type("textarea", "the best ai search engine");

    // Press Enter
    await page.keyboard.press("Enter");

    // Wait for the search results to load
    await page.waitForSelector(
        "div.sgs-common-paa > div > div.qk-view > div:nth-of-type(1) div.qk-text"
    );
}
