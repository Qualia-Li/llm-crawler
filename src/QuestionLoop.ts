import {engines, Engines} from "@/src/engines/engines";
import {save} from "@/src/utils/save";


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
            question.extendedKeywords.forEach((value,index)=>{
                // -1 to delete coreKeyword
                if (question.platforms[plat as Engines].length - 1 < index + 1) {
                    tasks[plat as Engines].push(value)
                }
            })
        }
    }
}

export const QuestionLoop = async () => {
    mapQuestionsToTasks();
    //console.log(tasks)

    for (const plat in engines) {
        await (async () => {
            for (const text of tasks[plat as Engines]) {
                const res = await engines[plat as Engines].ask(text);
                tasks[plat as Engines].push(res)
                questionList.forEach(function (v) {
                    if (v.coreKeyword === text || v.extendedKeywords.includes(text)) v.platforms[plat as Engines].push(res)
                })
                save()
            }
        })();
    }
}

