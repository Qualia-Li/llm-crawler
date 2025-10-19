import {engines} from "./engines/engines";
import {BaseEngine} from "./engines/base";

import {save} from "@/src/utils/save";
import {toMD} from "@/src/utils/markdown";

export async function QuestionLoop() {
    // Each question
    for (const question of global.questionList) {
        const promises = []
        // Each engine
        console.log(`--------------\nQuestion:${question.coreKeyword}`)
        for (const plat of Array.from(question.platforms.keys())) {
            try {
                console.log(`${plat} ${question.platforms.get(plat)?.length ? `OK` : `Processing`}`)
                if (question.platforms.get(plat)?.length) continue

                let engine = engines[plat] as BaseEngine
                if (!engine) continue;
                let res = (async () => ({
                    text: await engine.ask(question), plat: plat
                }))()
                promises.push(res);
                //debug
                //if(Math.random() > 0.5){throw new Error("dbg")}
            } catch (err) {
                console.log(err)
            }
        }
        let result = await Promise.all(promises)
        result?.forEach(function (value) {
            question.platforms.set(value.plat, value.text.map(toMD))
        })
        console.log(question.platforms)

        //Save
        save()
    }
}
