import {BaseEngine} from "@/src/engines/base";

import {askQuark} from "@/src/engines/askQuark";
import {askDeepseek} from "@/src/engines/askDeepseek";
import {askKimi} from "@/src/engines/askKimi";

async function getEngine(engineClass:typeof BaseEngine) {
    let a = new engineClass()
    await a.init()
    return a
}

export const engines:{
    [key in Engines]:BaseEngine
} = {
    deepseek:await getEngine(askDeepseek),
    // 豆包: notImpl,
    // 元宝: notImpl,
    // 文心一言: notImpl,
    夸克: await getEngine(askQuark),
    kimi: await getEngine(askKimi),
};

export type Engines = "deepseek"|"夸克"|"kimi"/*|"豆包"|"元宝"|"文心一言"*/