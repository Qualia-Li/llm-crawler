import { questionList } from "./question-list";
import replay from "./replay.json";


const recording = [replay];
recording.length = 0

questionList.forEach((question,index) => {
    const oneReplay = replay
    oneReplay.steps[3].value = question
    recording[index] = oneReplay
})

export { recording };
