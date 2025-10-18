import {engines} from "./engines/engines";
import {BaseEngine} from "./engines/base";

import {save} from "@/src/utils/save";

export async function QuestionLoop() {
    // Each question
    for (const question of global.questionList) {
        const promises = []
        // Each engine
        for (const plat of Array.from(question.platforms.keys())) {
            console.log(question.platforms.get(plat)?.length)
            if(question.platforms.get(plat)?.length) continue

            let engine = engines[plat] as BaseEngine
            if (!engine) continue;
            let res = (async () => ({
                text: await engine.ask(question), plat: plat
            }))()
            promises.push(res);
        }
        let result = await Promise.all(promises)
        result.forEach(function (value) {
            question.platforms.set(value.plat, value.text)
        })
        // console.log(questionList)

        //Save
        save().then(function () {
            console.log("Question Loop saved.");
        })
    }
}
