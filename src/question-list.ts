import * as csv from "csv";
import { createReadStream } from "node:fs";

export interface SearchKeyword {
    // 核心词 (Core Keywords)
    coreKeyword: string;

    // 拓展词 (Extended Keywords)
    extendedKeywords: string[];

    // 平台 (Platforms)
    platforms: { name:string,completed:boolean }[];

    // 品牌名 (Brand Names)
    brandNames: string;
}

export const questionList: SearchKeyword[] = [];
let tmpBrandName = "No Brand";
createReadStream("../data/geo.csv")
    .pipe(csv.parse())
    .on("data", (row: string[]) => {
        if(row[0]){
            tmpBrandName = row[0]
            questionList.push({
                coreKeyword: tmpBrandName,
                extendedKeywords: [row[1]],
                platforms: row[2].split("，").map(val=>({name:val,completed:false})),
                brandNames: row[3],
            });
        }
        else {
            questionList[questionList.length - 1].extendedKeywords.push(row[1])
        }
    })
    .on("end", () => {
        console.log("CSV file successfully processed");
        console.log(questionList);
    });
