const tmpPage = await browser.newPage()
tmpPage.goto("about:blank")

export const pure = async (html: string) => {
    await tmpPage.evaluate("document.body.innerHTML=" + `"${html}"`)
    await tmpPage.evaluate(() => {
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
    await tmpPage.evaluate(function (){
        document.querySelectorAll("style,script").forEach(e=>e.remove())
    })

    return tmpPage.evaluate(() => {
        return document.body.innerHTML;
    })
}


