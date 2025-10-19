import {engines} from "./engines/engines";
import {BaseEngine} from "./engines/base";

import {save} from "@/src/utils/save";

export async function QuestionLoop() {
    try{
        // Each question
        for (const question of global.questionList) {
            const promises = []
            // Each engine
            for (const plat of Array.from(question.platforms.keys())) {
                try{
                    console.log(question.platforms.get(plat)?.length)
                    if (question.platforms.get(plat)?.length) continue

                    let engine = engines[plat] as BaseEngine
                    if (!engine) continue;
                    let res = (async () => ({
                        text: await engine.ask(question), plat: plat
                    }))()
                    promises.push(res);
                    //debug
                    //if(Math.random() > 0.5){throw new Error("dbg")}
                }catch (err){
                    console.log(err)
                }
            }
            if (promises.length) {
                var result = await Promise.all(promises)
            }
            result?.forEach(function (value) {
                question.platforms.set(value.plat, value.text)
            })
            // console.log(questionList)

            //Save
            save().then(function () {
                console.log("Question Loop saved.");
            })
        }
    } catch (error) {
        console.error(error);
    }
}
