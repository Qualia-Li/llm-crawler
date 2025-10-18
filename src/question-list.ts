import * as csv from "csv";
import fs, {createReadStream} from "node:fs";
import {Engines} from "./engines/engines";

export interface SearchKeyword {
    // 核心词 (Core Keywords)
    coreKeyword: string;

    // 拓展词 (Extended Keywords)
    extendedKeywords: string[];

    // 平台 (Platforms)
    platforms: Map<Engines, string[]>;

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
                    platforms: new Map(row[2].split("，").map(val => ([val as Engines, []]))),
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

if (fs.existsSync(".//data/result.json")  && false) {
    questionList  = await import(".//data/result.json");
} else {
    questionList = parasCSV()
}
