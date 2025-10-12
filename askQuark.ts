import { Locator, Page, Viewport } from "puppeteer";

export async function askQuark(page: Page, question: string) {
    const viewport: Viewport = {
        width: 753,
        height: 820,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: false,
    };
    await page.setViewport(viewport);

    // Step 2: Navigate to Quark AI
    await page.goto("https://ai.quark.cn/", {
        waitUntil: "networkidle0",
    });

    // Wait for navigation to complete and verify title
    await page.waitForFunction(() => document.title.includes("夸克"));

    // Step 3: Click on the search textarea
    const textareaSelectors = [
        "textarea",
        'xpath///[@id="root"]/div/div[1]/div/div[2]/div/div[2]/div/div/div[2]/div[1]/div/textarea',
    ];

    let textareaElement = null;
    for (const selector of textareaSelectors) {
        try {
            if (selector.startsWith("xpath")) {
                const xpath = selector.replace("xpath//", "");
                const elements = await page.$x(xpath);
                if (elements.length > 0) {
                    textareaElement = elements[0];
                    break;
                }
            } else {
                textareaElement = await page.$(selector);
                if (textareaElement) break;
            }
        } catch (error) {
            continue;
        }
    }

    if (!textareaElement) {
        throw new Error("Could not find search textarea element");
    }

    // Click with offset
    const boundingBox = await textareaElement.boundingBox();
    if (boundingBox) {
        await page.mouse.click(
            boundingBox.x + 267.2017059326172,
            boundingBox.y + 19.693206787109375
        );
    } else {
        await textareaElement.click();
    }

    // Step 4: Type the search query
    await page.keyboard.type("the best ai search engine");

    // Step 5 & 6: Press Enter key
    await page.keyboard.press("Enter");

    // Wait for navigation after search
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    // Step 7: Wait for search results to load
    const resultSelectors = [
        "div.sgs-common-paa > div > div.qk-view > div:nth-of-type(1) div.qk-text",
        'xpath///[@id="sc_sgs_general_16225_94816_16225_52212"]/div[1]/div[2]/div/div[2]/div/div[3]/div[1]/div[11]/div/div[1]/div[1]/div/div/div[2]',
    ];

    await page.waitForFunction(
        (selectors: string[]) => {
            for (const selector of selectors) {
                if (selector.startsWith("xpath")) {
                    const xpath = selector.replace("xpath//", "");
                    const result = document.evaluate(
                        xpath,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    );
                    if (result.singleNodeValue) return true;
                } else {
                    if (document.querySelector(selector)) return true;
                }
            }
            return false;
        },
        {},
        resultSelectors
    );

    console.log("Quark AI automation completed successfully!");

    // Optional: Wait a bit to see the results
    await page.waitForTimeout(3000);
}
