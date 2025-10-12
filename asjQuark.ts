import { Locator, Page } from "puppeteer";

export async function askQuark(page: Page, question: string) {
    const timeout = 5000
    {
        const targetPage = page;
        await targetPage.setViewport({
            width: 753,
            height: 820,
        });
    }
    {
        const targetPage = page;
        await targetPage.goto("https://ai.quark.cn/");
    }
    {
        const targetPage = page;
        await Locator.race([
            targetPage.locator("::-p-aria(搜资料、提问题、找答案)"),
            targetPage.locator("textarea"),
            targetPage.locator(
                '::-p-xpath(//*[@id=\\"root\\"]/div/div[1]/div/div[2]/div/div[2]/div/div/div[2]/div[1]/div/textarea)'
            ),
            targetPage.locator(":scope >>> textarea"),
        ])
            .setTimeout(timeout)
            .click({
                offset: {
                    x: 267.2017059326172,
                    y: 19.693206787109375,
                },
            });
    }
    {
        const targetPage = page;
        await Locator.race([
            targetPage.locator("::-p-aria(搜资料、提问题、找答案)"),
            targetPage.locator("textarea"),
            targetPage.locator(
                '::-p-xpath(//*[@id=\\"root\\"]/div/div[1]/div/div[2]/div/div[2]/div/div/div[2]/div[1]/div/textarea)'
            ),
            targetPage.locator(":scope >>> textarea"),
        ])
            .setTimeout(timeout)
            .fill("the best ai search engine");
    }
    {
        const targetPage = page;
        const promises: any[] = [];
        const startWaitingForEvents = () => {
            promises.push(targetPage.waitForNavigation());
        };
        await targetPage.keyboard.down("Enter");
        await Promise.all(promises);
    }
    {
        const targetPage = page;
        await targetPage.keyboard.up("Enter");
    }
    {
        const targetPage = page;
        await waitForElement(
            {
                type: "waitForElement",
                target: "main",
                selectors: [
                    "div.sgs-common-paa > div > div.qk-view > div:nth-of-type(1) div.qk-text",
                    'xpath///*[@id="sc_sgs_general_16225_94816_16225_52212"]/div[1]/div[2]/div/div[2]/div/div[3]/div[1]/div[11]/div/div[1]/div[1]/div/div/div[2]',
                    "pierce/div.sgs-common-paa > div > div.qk-view > div:nth-of-type(1) div.qk-text",
                ],
            },
            targetPage,
            timeout
        );
    }

    async function waitForElement(step: { type?: string; target?: string; selectors?: any; count?: any; operator?: string; visible?: any; properties?: any; attributes?: any; }, frame: Page, timeout: number) {
        const {
            count = 1,
            operator = ">=",
            visible = true,
            properties,
            attributes,
        } = step;
        const compFn = {
            "==": (a: any, b: any) => a === b,
            ">=": (a: number, b: number) => a >= b,
            "<=": (a: number, b: number) => a <= b,
        }[operator];
        await waitForFunction(async () => {
            const elements = await querySelectorsAll(step.selectors, frame);
            let result = compFn!(elements.length, count);
            const elementsHandle = await frame.evaluateHandle((...elements: any) => {
                return elements;
            }, ...elements);
            await Promise.all(elements.map((element: { dispose: () => any; }) => element.dispose()));
            if (result && (properties || attributes)) {
                result = await elementsHandle.evaluate(
                    (elements: any, properties: any, attributes: { [s: string]: unknown; } | ArrayLike<unknown>) => {
                        for (const element of elements) {
                            if (attributes) {
                                for (const [name, value] of Object.entries(
                                    attributes
                                )) {
                                    if (element.getAttribute(name) !== value) {
                                        return false;
                                    }
                                }
                            }
                            if (properties) {
                                if (!isDeepMatch(properties, element)) {
                                    return false;
                                }
                            }
                        }
                        return true;

                        function isDeepMatch(a: unknown, b: { [x: string]: any; }) {
                            if (a === b) {
                                return true;
                            }
                            if ((a && !b) || (!a && b)) {
                                return false;
                            }
                            if (
                                !(a instanceof Object) ||
                                !(b instanceof Object)
                            ) {
                                return false;
                            }
                            for (const [key, value] of Object.entries(a)) {
                                if (!isDeepMatch(value, b[key])) {
                                    return false;
                                }
                            }
                            return true;
                        }
                    },
                    properties,
                    attributes
                );
            }
            await elementsHandle.dispose();
            return result === visible;
        }, timeout);
    }

    async function querySelectorsAll(selectors: any, frame: any) {
        for (const selector of selectors) {
            const result = await querySelectorAll(selector, frame);
            if (result.length) {
                return result;
            }
        }
        return [];
    }

    async function querySelectorAll(selector: string | any[], frame: { $$: (arg0: any) => any[] | PromiseLike<any[]>; }) {
        if (!Array.isArray(selector)) {
            selector = [selector];
        }
        if (!selector.length) {
            throw new Error("Empty selector provided to querySelectorAll");
        }
        let elements = [];
        for (let i = 0; i < selector.length; i++) {
            const part = selector[i];
            if (i === 0) {
                elements = await frame.$$(part);
            } else {
                const tmpElements:any = elements;
                elements = [];
                for (const el of tmpElements) {
                    elements.push(...(await el.$$(part)));
                }
            }
            if (elements.length === 0) {
                return [];
            }
            if (i < selector.length - 1) {
                const tmpElements = [];
                for (const el of elements) {
                    const newEl = (
                        await el.evaluateHandle((el: { shadowRoot: any; }) =>
                            el.shadowRoot ? el.shadowRoot : el
                        )
                    ).asElement();
                    if (newEl) {
                        tmpElements.push(newEl);
                    }
                }
                elements = tmpElements;
            }
        }
        return elements;
    }

    async function waitForFunction(fn: { (): Promise<boolean>; (): any; }, timeout: number | undefined) {
        let isActive = true;
        const timeoutId = setTimeout(() => {
            isActive = false;
        }, timeout);
        while (isActive) {
            const result = await fn();
            if (result) {
                clearTimeout(timeoutId);
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error("Timed out");
    }
}
