import fs from "node:fs";
import {getDataJson} from "@/src/utils/pureObj";

export async function save() {
    fs.writeFileSync(".//data/result.json", getDataJson(questionList));
    console.log("Question Loop saved.");
}