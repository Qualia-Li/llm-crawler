import * as csv from "csv";
import fs, {createReadStream} from "node:fs";
import {Engines} from "./engines/engines";

export interface SearchKeyword {
    // 核心词 (Core Keywords)
    coreKeyword: string;

    // 拓展词 (Extended Keywords)
    extendedKeywords: string[];

    // 平台 (Platforms)
    platforms: { [key in Engines]: string[] };

    // 品牌名 (Brand Names)
    brandNames: string;
}

globalThis.questionList = [];

function parasCSV() {
    const list: SearchKeyword[] = [];
    let tmpBrandName = "No Brand";
    createReadStream(".//data/geo.csv")
        .pipe(csv.parse())
        .on("data", (row: string[]) => {
            if (row[0]) {
                tmpBrandName = row[0]
                list.push({
                    coreKeyword: tmpBrandName,
                    extendedKeywords: [row[1]],
                    // @ts-ignore
                    platforms: Object.fromEntries(row[2].split("，").map(val => ([val, []]))),
                    brandNames: row[3],
                });
            } else {
                list[list.length - 1].extendedKeywords.push(row[1])
            }
        })
        .on("end", () => {
            console.log("CSV file successfully processed");
        });
    return list;
}

if (fs.existsSync(".//data/result.json")/*  && false*/) {
    //@ts-ignore
    questionList = JSON.parse(fs.readFileSync('./data/result.json', 'utf8'))
    for(let q of questionList){
        q.platforms = Object.fromEntries(Object.entries(q.platforms)) as SearchKeyword["platforms"];
    }
    // console.log(questionList);
    console.log("Question list loaded from result.json")
} else {
    questionList = parasCSV()
}
