import {engines, Engines} from "@/src/engines/engines";
import {save} from "@/src/utils/save";
import {myStealth} from "@/src/engines/myStealth";
import {toMD} from "@/src/utils/markdown";


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
        for (const platformsKey in question.platforms) {
            const plat = platformsKey as Engines
            if (question.platforms[plat].length == 0) {
                tasks[plat].push(question.coreKeyword)
            }
            question.extendedKeywords.forEach((value, index) => {
                // -1 to delete coreKeyword
                if (question.platforms[plat].length - 1 < index + 1) {
                    tasks[plat].push(value)
                }
            })
        }
    }
}

const perEngine = async (plat: Engines) => {
    for (const text of tasks[plat]) {
        // console.log(`Engine:${plat}`)
        await engines[plat].page.bringToFront();
        const res = await engines[plat].ask(text)
            .catch(function (e) {
                console.log("Error " + plat)
                console.error(e)
            });
        const md = toMD(res || "")
        tasks[plat].push(md)
        questionList.forEach(function (v) {
            if (v.coreKeyword === text || v.extendedKeywords.includes(text)) v.platforms[plat].push(md)
        })
        await save() // await no need
    }
}
export const QuestionLoop = async () => {
    mapQuestionsToTasks();
    //console.log(tasks)

    for (const platformsKey in engines) {
        /*await */ //no await as we'd like it to run parallelly
        const plat = platformsKey as Engines
        perEngine(plat).catch(e => {
            console.error(`Engine:${plat} Error`)
            console.error(e)
        });

        //in case of freeze
        // cause context break?
        {
            setInterval(() => {
                setTimeout(() => {
                    engines[plat].page.bringToFront()
                }, Math.random() * 20)

            }, 20_000);
            for (let i = 0; i < 10; i++) {
                setInterval(() => {
                    setTimeout(() => {
                        engines[plat].page.evaluate(myStealth)
                    }, Math.random() * 20)
                }, 20_000)
            }
        }
    }
}

