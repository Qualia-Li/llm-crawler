import {askDeepseek} from "./askDeepseek";

async function getDeepseek() {
    let a = new askDeepseek()
    await a.init()
    return a
}

export const engines = {
    deepseek:await getDeepseek(),
    // 豆包: notImpl,
    // 元宝: notImpl,
    // 文心一言: notImpl,
    // 夸克: notImpl,
    // kimi: notImpl,
};

export type Engines = "deepseek"/*|"豆包"|"元宝"|"文心一言"|"夸克"|"kimi"*/