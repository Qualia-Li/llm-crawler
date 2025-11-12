let tmpPage: any = null;

const getTmpPage = async () => {
    if (!tmpPage) {
        tmpPage = await globalThis.browser.newPage();

        // Set a smaller viewport to make it less intrusive
        await tmpPage.setViewport({ width: 400, height: 300 });

        await tmpPage.goto("about:blank");
    }
    return tmpPage;
};

export const pure = async (html: string) => {
    const page = await getTmpPage();
    await page.evaluate("document.body.innerHTML=" + `"${html}"`)
    await page.evaluate(() => {
        // 获取页面中所有元素
        const allElements = document.querySelectorAll('*');

// 遍历每个元素
        allElements.forEach(element => {
            // 获取当前元素的所有属性（快照，避免动态修改导致问题）
            const attrs = Array.from(element.attributes);

            // 删除每个属性
            attrs.forEach(attr => {
                if (attr.name.match("href|src")) return
                element.removeAttribute(attr.name);
            });
        });
    })
    await page.evaluate(function (){
        document.querySelectorAll("style,script").forEach(e=>e.remove())
    })

    return page.evaluate(() => {
        return document.body.innerHTML;
    })
}


