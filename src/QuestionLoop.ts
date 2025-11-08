import {engines, Engines} from "@/src/engines/engines";
import {save} from "@/src/utils/save";
import {toMD} from "@/src/utils/markdown";
import {myStealth} from "@/src/engines/myStealth";


let tasks: { [key in Engines]: string[] } = {
    deepseek: [],
    豆包: [],
    元宝: [],
    文心一言: [],
    夸克: [],
    kimi: [],
};

const mapQuestionsToTasks = () => {
    for (const question of questionList) {
        for (const plat in question.platforms) {
            if (question.platforms[plat as Engines].length == 0) {
                tasks[plat as Engines].push(question.coreKeyword)
            }
            question.extendedKeywords.forEach((value, index) => {
                // -1 to delete coreKeyword
                if (question.platforms[plat as Engines].length - 1 < index + 1) {
                    tasks[plat as Engines].push(value)
                }
            })
        }
    }
}

const perEngine = async (plat: string) => {
    for (const text of tasks[plat as Engines]) {
        console.log(`Engine:${plat}`)
        await engines[plat as Engines].page.bringToFront();
        const res = toMD(await engines[plat as Engines].ask(text)
            .catch(function (e) {
                console.error(e)
            }))
        tasks[plat as Engines].push(res)
        questionList.forEach(function (v) {
            if (v.coreKeyword === text || v.extendedKeywords.includes(text)) v.platforms[plat as Engines].push(res)
        })
        save()
    }
}
export const QuestionLoop = async () => {
    mapQuestionsToTasks();
    //console.log(tasks)

    for (const plat in engines) {
        /*await */ //no await as we'd like it to run parallelly
        perEngine(plat).catch(e => {
            console.error(`Engine:${plat} Error`)
            console.error(e)
        });

        //in case of freeze
        setInterval(()=>{
            setTimeout(() => {
                engines[plat as Engines].page.bringToFront()
            },Math.random() * 20)
            setTimeout(() => {
                engines[plat as Engines].page.evaluate(myStealth)
            },Math.random() * 20)
        },20_000)
    }
}

