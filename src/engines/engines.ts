import {askDeepseek} from "./askDeepseek";
import {askQuark} from "@/src/engines/askQuark";

async function getDeepseek() {
    let a = new askDeepseek()
    await a.init()
    return a
}
async function getQuark() {
    let a = new askQuark()
    await a.init()
    return a
}

export const engines = {
    deepseek:await getDeepseek(),
    // 豆包: notImpl,
    // 元宝: notImpl,
    // 文心一言: notImpl,
    夸克: await getQuark(),
    // kimi: notImpl,
};

export type Engines = "deepseek"|"夸克"/*|"豆包"|"元宝"|"文心一言"|"kimi"*/