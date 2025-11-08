import {BaseEngine} from "@/src/engines/base";

import {askQuark} from "@/src/engines/askQuark";
import {askDeepseek} from "@/src/engines/askDeepseek";
import {askKimi} from "@/src/engines/askKimi";
import {askDoubao} from "@/src/engines/askDoubao";
import {askYuanbao} from "@/src/engines/askYuanbao";
import {askErnie} from "@/src/engines/askErnie";

async function getEngine(engineClass:typeof BaseEngine) {
    let a = new engineClass()
    await a.init()
    return a
}

export const engines:{
    [key in Engines]:BaseEngine
} = {
    deepseek:await getEngine(askDeepseek),
    豆包: await getEngine(askDoubao),
    元宝: await getEngine(askYuanbao),
    //文心一言: await getEngine(askErnie),
    夸克: await getEngine(askQuark),
    kimi: await getEngine(askKimi),
};

export type Engines = "deepseek"|"夸克"|"kimi"|"豆包"|"元宝"|"文心一言"