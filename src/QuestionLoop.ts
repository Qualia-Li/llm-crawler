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
                const finished = (question.platforms.get(plat)?.length || 0) >= question.extendedKeywords.length;
                console.log(`${plat} ${finished ? `OK` : `Processing`}`)
                if (finished) continue

                let engine = engines[plat] as BaseEngine
                if (!engine) continue;
                let res = (async () => {
                    let a = ({
                        text: [!(question.platforms.get(plat)?.length) ? (await engine.ask(question.coreKeyword).catch(console.error)) : question.platforms.get(plat)![0]],
                        plat: plat
                    })
                    for (const q of question.extendedKeywords) {
                        const index = question.extendedKeywords.indexOf(q);
                        if (!((question.platforms.get(plat)?.length || 1) >= index + 1)) {
                            a.text.push((await engine.ask(q)
                                    .catch(console.error)
                            ))
                        } else {
                            a.text.push(question.platforms.get(plat)![index])
                        }
                    }
                    return a;
                })()
                promises.push(res);
            } catch (err) {
                console.log(plat)
                console.error(err)
            }
        }
        let result = await Promise.all(promises)
        result?.forEach(function (value) {
            question.platforms.set(value.plat, value.text.map(toMD))
        })
        // console.log(question.platforms)

        //Save
        save()
    }
}
