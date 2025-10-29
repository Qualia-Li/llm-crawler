import fs from "node:fs";
import {getDataJson} from "@/src/utils/pureObj";

export async function save() {
    console.log("Question Loop saved.");
    fs.writeFileSync(".//data/result.json", getDataJson(questionList));
}