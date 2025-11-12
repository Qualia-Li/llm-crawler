import {BaseEngine} from "@/src/engines/base";

import {askQuark} from "@/src/engines/askQuark";
import {askDeepseek} from "@/src/engines/askDeepseek";
import {askKimi} from "@/src/engines/askKimi";
import {askDoubao} from "@/src/engines/askDoubao";
import {askYuanbao} from "@/src/engines/askYuanbao";
import {askErnie} from "@/src/engines/askErnie";

export type Engines = "deepseek"|"夸克"|"kimi"|"豆包"|"元宝"|"文心一言"

async function getEngine(engineClass:typeof BaseEngine) {
    let a = new engineClass()
    await a.init()
    return a
}

// Engine class map
const engineClasses: { [key in Engines]: typeof BaseEngine } = {
    deepseek: askDeepseek,
    豆包: askDoubao,
    元宝: askYuanbao,
    文心一言: askErnie,
    夸克: askQuark,
    kimi: askKimi,
};

// Lazy-initialized engines cache
const enginesCache: Partial<{ [key in Engines]: BaseEngine }> = {};

// Proxy to lazily initialize engines on first access
export const engines = new Proxy({} as { [key in Engines]: BaseEngine }, {
    get(target, prop: string) {
        const engineName = prop as Engines;

        // Return cached engine if already initialized
        if (enginesCache[engineName]) {
            return enginesCache[engineName];
        }

        // Initialize engine lazily (this will be async, so we need to handle it)
        // For now, throw an error if accessed before initialization
        throw new Error(`Engine "${engineName}" not initialized. Call initializeEngines() first.`);
    }
});

/**
 * Initialize only the selected engines
 */
export async function initializeEngines(selectedEngines: Engines[]) {
    console.log(`Initializing engines: ${selectedEngines.join(', ')}`);

    for (const engineName of selectedEngines) {
        if (!enginesCache[engineName]) {
            const EngineClass = engineClasses[engineName];
            enginesCache[engineName] = await getEngine(EngineClass);
            console.log(`✓ Initialized ${engineName}`);
        }
    }
}