import { exit } from "process";
import { Page } from "puppeteer";
import { errList, db } from ".";
import { askQuark } from "./askQuark";
import { SearchKeyword } from "./question-list";

const ASK_START = 50

export async function QuestionLoop(page: Page, list: SearchKeyword[]) {
    for (const question of list.slice(ASK_START)) {
        try {
            //Run
            const answer = await askQuark(
                page,
                question.coreKeywords + question.extendedKeywords
            );

            //Process data
            dbSaveResult(question, answer);
        } catch (error) {
            console.log("Error while processing: " + question);
            console.log(error);
            dbErrLog(question, error);
            errList.push(question);
            if (errList.length >= 5) exit(1);
        }
    }

    function dbSaveResult(question: SearchKeyword, answer: string) {
        db.serialize(() => {
            db.run(
                `INSERT OR REPLACE INTO result (question, answer, refer, engine) VALUES (?, ?, ?, ?)`,
                [
                    JSON.stringify(question),
                    answer,
                    "yet to do:", //TODO
                    askQuark.name,
                ]
            );
        });
    }

    function dbErrLog(question: SearchKeyword, error: unknown) {
        db.serialize(() => {
            db.run(
                `INSERT OR REPLACE INTO errorlog (question, message) VALUES (?, ?)`,
                [
                    [question.coreKeywords, question.extendedKeywords].join(
                        "，"
                    ),
                    (error as Error).message || String(error),
                ]
            );
        });
    }
}
