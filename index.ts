import puppeteer, { Page } from "puppeteer";
import { questionListAdvanced, SearchKeyword } from "./question-list";
import { askQuark } from "./askQuark";
import { exit } from "node:process";
import { verbose } from "sqlite3";
import { askDeepseek } from "./askDeepseek";

//DB init
const sqlite3 = verbose();
const db = new sqlite3.Database("./sqlite3.db");
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS result (
        question TEXT PRIMARY KEY,
        answer TEXT,
        refer TEXT,
        engine TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS errorlog (
        question TEXT PRIMARY KEY,
        message TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

//Engines
const engines = {
    deepseek: askDeepseek,
    豆包: () => {
        //TODO
    },
    元宝: () => {
        //TODO
    },
    文心一言: () => {
        //TODO
    },
    夸克: askQuark,
    kimi: () => {
        //TODO
    },
};

const errList: SearchKeyword[] = [];
const Main = async () => {
    //Launch browser
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
        userDataDir: "./user-data",
    });

    //Set up page
    const page = await browser.newPage();
    await page.setViewport({
        width: 1000,
        height: 600,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: false,
    });

    //Question Loop
    do {
        await QuestionLoop(page);
    } while (errList.length);

    //Close DB
    db.close(() => {
        console.log("DB closed.");
    });
};

Main();
async function QuestionLoop(page: Page) {
    for (const question of questionListAdvanced) {
        try {
            //Run
            const answer = await askQuark(page, question.coreKeywords + question.extendedKeywords);

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
                    [question.coreKeywords, question.extendedKeywords[1]].join(
                        "，"
                    ),
                    (error as Error).message || String(error),
                ]
            );
        });
    }
}
