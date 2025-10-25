import fs from "node:fs";
import {convertMapToObj} from "@/src/utils/pureObj";

export function getDataJson(data:any) {
    return JSON.stringify(convertMapToObj(data));
}

export async function save() {
    console.log(questionList[0].platforms)
    console.log("Question Loop saved.");
    fs.writeFileSync(".//data/result.json", getDataJson(questionList));
}