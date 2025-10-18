import {SearchKeyword} from "./question-list";
import {engines} from "./engines/engines";
import {BaseEngine} from "./engines/base";

export async function QuestionLoop(list: SearchKeyword[]) {
    // Each question
    for (const question of list) {
        const promises:Promise<void>[] = []
        // Each engine
        for (const plat of Array.from(question.platforms.keys())) {

            let a=engines[plat] as BaseEngine
            if(!a) continue;
            let promise = a.ask(question)
            promises.push(promise);

            // log
            if(question.platforms.get(plat)?.length != 0) {
                console.log(question.platforms.get(plat))
            }
        }
        await Promise.all(promises)
    }
}
