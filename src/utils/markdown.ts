interface LinkReference {
    text: string;
    url: string;
    title?: string;
}

export function convertInlineToReference(markdown: string): string {
    const linkRegex = /!?\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g;
    const references: LinkReference[] = [];
    let match: RegExpExecArray | null;

    // Find all inline links
    while ((match = linkRegex.exec(markdown)) !== null) {
        const [fullMatch, text, url, title] = match;
        references.push({ text, url, title });
    }

    // Remove duplicates while preserving order
    const uniqueRefs = references.filter((ref, index, self) =>
            index === self.findIndex(r =>
                r.text === ref.text &&
                r.url === ref.url &&
                r.title === ref.title
            )
    );

    // Create reference map
    const refMap = new Map<string, string>();
    uniqueRefs.forEach((ref, index) => {
        const key = `${ref.text}|${ref.url}|${ref.title || ''}`;
        refMap.set(key, `[${index + 1}]`);
    });

    // Replace inline links with references
    let result = markdown.replace(linkRegex, (match, text, url, title) => {
        const key = `${text}|${url}|${title || ''}`;
        const refId = refMap.get(key) || '[1]'; // Fallback shouldn't happen
        return title
            ? `![${text}]${refId} "${title}"`
            : `![${text}]${refId}`;
    });

    // Append reference definitions
    if (uniqueRefs.length > 0) {
        result += '\n\n';
        uniqueRefs.forEach((ref, index) => {
            const id = index + 1;
            if (ref.title) {
                result += `[${id}]: ${ref.url} "${ref.title}"\n`;
            } else {
                result += `[${id}]: ${ref.url}\n`;
            }
        });
    }

    return result;
}

const test =`办理护照的流程和所需材料会根据你的户籍情况以及是在**国内办理**还是**国外办理**有所不同。下面我为你梳理了详细的办理指南。

### 🗺️ 国内办理护照流程

如果你本人在国内，办理普通护照通常需要前往户籍地或居住地的公安机关出入境管理机构。

**办理地点**  
你需要前往**区（县）级以上**地方公安机关的**出入境接待大厅**办理[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。例如，在深圳市，就有多个政务服务中心设有出入境接待服务厅[\\-3](http://wsbs.sz.gov.cn/shenzhen/project/phoneGuide?code=00754268901001650013440300)。

**所需材料**  
办理前，请提前准备好以下材料：

材料类型

具体要求

特殊人群补充材料

**身份证明**

提交本人有效的**居民身份证**[\\-7](http://www.shandong.gov.cn/art/2022/8/2/art_315072_542.html)。未满16周岁的申请人，如未办理身份证，可交验**户口簿**[\\-7](http://www.shandong.gov.cn/art/2022/8/2/art_315072_542.html)。

**国家工作人员**：需提交本人所属工作单位或上级主管单位出具的**同意办理出入境证件的证明**[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)[\\-7](http://www.shandong.gov.cn/art/2022/8/2/art_315072_542.html)。

**申请表格**

提交填写完整的 **《中国公民出入境证件申请表》** [\\-7](http://www.shandong.gov.cn/art/2022/8/2/art_315072_542.html)。

**现役军人**：需交验本人身份证明（如军官证等）及具有审批权的军队系统主管部门出具的**同意办理意见**[\\-7](http://www.shandong.gov.cn/art/2022/8/2/art_315072_542.html)。

**证件照片**

提供符合 **《出入境证件相片照相指引》** 标准的近期**免冠照片**[\\-7](http://www.shandong.gov.cn/art/2022/8/2/art_315072_542.html)。通常可以在出入境接待大厅的照相区现场拍摄[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。

**办理流程**  
一般流程如下，具体可能因地区略有差异：

1.  **填写申请表**：在出入境接待大厅的自助办理机上或人工窗口填写《中国公民出入境证件申请表》并打印[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。
    
2.  **拍照**：前往照相区拍摄符合标准的证件照（如果未提前准备）[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。
    
3.  **取号受理**：携带所有材料和申请表到受理窗口领号，提交申请并核对信息[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。
    
4.  **缴费取证**：受理完成后，扫描回执单上的二维码缴纳费用[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。之后可选择**邮寄**或**现场领取**证件。
    

**办理时限**

*   **本省户籍**：一般情况下，**7个工作日**后可以领取[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)[\\-5](http://gat.fujian.gov.cn/ztzl/cryjfwwj/cjwt_28283/202004/t20200407_5232056.htm)。
    
*   **外省户籍**：办理时间可能延长至**20天**[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。
    
*   若遇到**紧急情况**（如开学日期临近、探望危重病人等），可申请加急办理，加急件通常在**5个工作日内**完成[\\-5](http://gat.fujian.gov.cn/ztzl/cryjfwwj/cjwt_28283/202004/t20200407_5232056.htm)。
    

**费用标准**  
根据搜索结果，自2024年7月1日起，普通护照的收费标准为每本**120元**[\\-9](https://agents.baidu.com/content/question/c375ab305c4499e7fd08f9d5)。如需在现场拍照或选择邮寄，可能会产生额外费用。

### ✈️ 国外办理护照须知

如果你身在国外，需要通过中国驻当地的大使馆或领事馆申请办理。

**办理方式**

*   部分驻外使领馆已开通 **“中国领事”APP线上办理**服务，你可以直接在APP上填写信息、上传材料[\\-2](https://do.china-embassy.gov.cn/lsfw/hzlxz/sqclxz/202506/t20250621_11654533.htm)。
    
*   也可以根据使领馆的要求**直接到馆办理**[\\-2](https://do.china-embassy.gov.cn/lsfw/hzlxz/sqclxz/202506/t20250621_11654533.htm)。
    

**所需材料**  
在国外办理护照，除了通常需要填写的申请表、照片和国籍状况声明书外，情况可能更复杂一些，特别是对于未成年人。下面这个表格汇总了不同业务的核心材料要求，但**强烈建议你提前查询目的地使领馆网站发布的具体须知**[\\-2](https://do.china-embassy.gov.cn/lsfw/hzlxz/sqclxz/202506/t20250621_11654533.htm)。

办理业务

核心所需材料

**首次申办（颁发）**

申请表、照片、国籍状况声明书、父母双方护照及居留/签证复印件（国外出生人员）、出生证明等亲子关系材料[\\-2](https://do.china-embassy.gov.cn/lsfw/hzlxz/sqclxz/202506/t20250621_11654533.htm)。

**护照换发**

申请表、照片、护照原件及资料页复印件、国籍状况声明书[\\-2](https://do.china-embassy.gov.cn/lsfw/hzlxz/sqclxz/202506/t20250621_11654533.htm)。

**护照补发**

申请表、照片、原护照复印件（如有）、护照遗失/损毁情况说明、国籍状况声明书[\\-2](https://do.china-embassy.gov.cn/lsfw/hzlxz/sqclxz/202506/t20250621_11654533.htm)。

**办理时限与费用**

*   **办理时限**：在海外通过APP申请护照，从提交到收到新护照，通常需要**约15个工作日**，不包括邮寄时间[\\-4](https://losangeles.china-consulate.gov.cn/lbqw/lszj/sfbz/202312/t20231229_11214632.htm)。旅行证则需要约10个工作日[\\-4](https://losangeles.china-consulate.gov.cn/lbqw/lszj/sfbz/202312/t20231229_11214632.htm)。
    
*   **费用**：海外办理护照的费用会根据当地货币和使领馆的规定有所不同。例如，中国驻洛杉矶总领馆的收费标准为**18美元**[\\-4](https://losangeles.china-consulate.gov.cn/lbqw/lszj/sfbz/202312/t20231229_11214632.htm)。支付方式可能包括微信支付或信用卡[\\-4](https://losangeles.china-consulate.gov.cn/lbqw/lszj/sfbz/202312/t20231229_11214632.htm)。
    

### 💡 重要注意事项

*   **未满16周岁的未成年人**：必须由**监护人陪同**办理[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。需要提交申请人本人的身份证或户口簿、监护证明（如出生证明）、监护人的身份证等[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)[\\-7](http://www.shandong.gov.cn/art/2022/8/2/art_315072_542.html)。如果监护人无法陪同，可以委托他人，但还需提交监护人的委托书以及陪同人的身份证明[\\-1](https://hlj.gov.cn/hlj/c107860/202309/c00_31666174.shtml)。
    
*   **只跑一次**：部分驻外使领馆实施了“只跑一次”政策。如辅助材料不齐，使领馆会一次性告知，并允许申请人通过电邮等方式补交，无需再次到馆[\\-6](https://ci.china-embassy.gov.cn/lsfw_0/202510/t20251014_11733134.htm)。
    
*   **提前确认**：由于各地政策可能微调，且驻外使领馆要求各异，**最稳妥的方式是提前通过电话或官方网站查询你所在地的具体办理要求**。
    

希望这些信息能帮助你顺利办好护照！如果你想了解特定城市的办理地点，可以告诉我你所在的城市，我再帮你看看。`
console.log(convertInlineToReference(test))